import {Router, Request, Response, NextFunction} from 'express';
import multer from 'multer';
import passport from 'passport';
import toMs from 'parse-duration';

import {passportedHandler} from '../../handlers';
import User, {Subscription} from '../../../models/UserModel';
import Post, {Like} from '../../../models/PostModel';
// import Wallet, {Transaction} from '../../../models/WalletModel';
import {Wallet, Transaction, transactionType} from '../../../models/paymentModels';
import {initMediaProcessing, initAvatarProcessing} from '../../../mediaProcessing';
import {validateImage, processMedia} from '../../../mediaProcessing';
import {imageValidationCode as validationCode, postValidationCode, errorCode} from '../../../utils/constants';
import {client as redisClient, getCacheKey, feedName, composeUser, composeUserByUsername} from '../../../utils/cache';
import limiter from '../../limiter';
import { keepFile } from '../../../utils/index';
import { transactionStatus } from '../../../models/WalletModel';
import { BigNumber } from 'bignumber.js';
import { processTransactionTask } from '../../../queues/tasks/payments';
import { addressIsValid, getBalance } from '../../../utils/waves';

const upload = multer();

let _processUser = userData => {
    let _data = userData;
    if (_data.avatar && _data.avatar.path) {
        _data.avatar.path = process.env.MEDIA_URL + _data.avatar.path;
    }
    return _data;
};

let _getSubscriptionUsers = (req, type, _user) => {
    return new Promise((resolve, reject) => {
        let nickname = req.params.nickname;
        if (!nickname) return resolve({error: 'Nickname is required', status: 400});
        let keyLink = getCacheKey('u', 'link', nickname);
        redisClient.get(keyLink, (err, username) => {
            if (err) return reject(err);
            if (!username) return resolve({error: 'User not found', status: 404});
            let key = getCacheKey('u', username, type);
            let page = 0;
            if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1);
            let pageSize = req.query.pageSize ? Math.min(parseInt(req.query.pageSize), 100) : 10;
            
            redisClient.zrevrange(key, page * pageSize, (page + 1) * pageSize - 1, async (err, usernames) => {
                if (err) return reject(err);
                if (!usernames) return resolve({data: []});
                let subscribers = [];
                for (let i = 0; i < usernames.length; i++) {
                    let subscriber = await composeUserByUsername(usernames[i], _user);
                    if (subscriber) {
                        subscribers.push(subscriber);
                    }
                }
                resolve({data: subscribers});
            });
        });
    });
}

export class UserRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getMe(req, res, next) {
        User
            .findOne({username: req.user.username})
            .select(['username', 'nickname', 'avatar', 'isAdmin'])
            .exec()
            .then(user => {
                if (user === null) res.sendStatus(401);
                composeUser(user.nickname, user).then(_user => {
                    if (!_user) return res.sendStatus(404);
                    res.json(_user);
                }).catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                });
            }).catch(err => {
                res.sendStatus(500);
            });
    }

    updateMe(req, res, next) {
        let user = req.user;
        let avatar = req.file || null;
        let nickname = req.body.nickname;
        
        new Promise((resolve, reject) => {
        
            if (!avatar) {
                resolve();
            } else {
                processMedia(avatar).then(imageData => {
                    initAvatarProcessing(user._id, imageData);
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }
        }).then(() => {
            if (nickname) {
                user.nickname = nickname;
                user.save().then(() => {
                    res.sendStatus(200);
                }).catch(err => {
                    if (err.errors && err.errors.nickname) {
                        switch (err.errors.nickname.kind) {
                            case 'minlength':
                                res.status(400).json({errorCode: errorCode.UPDATE_ME_NICKNAME_TOO_SHORT});
                                break;
                            case 'maxlength':
                                res.status(400).json({errorCode: errorCode.UPDATE_ME_NICKNAME_TOO_LONG});
                                break;
                            case 'unique':
                                res.status(400).json({errorCode: errorCode.UPDATE_ME_NICKNAME_EXISTS});
                            default:
                                res.sendStatus(400);
                        }
                    } else {
                        console.log(err);
                        res.sendStatus(500);
                    }
                });
            } else if (!nickname && !avatar ) {
                res.status(400).json({errorCode: errorCode.UPDATE_ME_NICKNAME_OR_AVATAR_REQUIRED});
            } else {
                res.sendStatus(200);
            }
        }).catch(err => {
            res.status(400).json({errorCode: errorCode.UPDATE_ME_AVATAR_PROCESSING_ERROR});
        });
    }

    getUser(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            let nickname = req.params.nickname;
            composeUser(nickname, user).then(user => {
                if (!user) return res.sendStatus(404);
                res.json(user);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        })(req, res, next);
    }

    getWallet(req, res, next) {
        let user = req.user;

        Wallet.findOne({owner: user}).then(wallet => {
            if (!wallet) return res.sendStatus(404);
            let withdrawalEnabled = !!process.env.WAVES_WITHDRAWAL_ENABLED 
                && wallet.balance.total.greaterThanOrEqualTo(process.env.WAVES_WITHDRAWAL_MIN_VALUE || 10);
        
            res.json({
                _id: wallet._id,
                withdrawalEnabled: withdrawalEnabled,
                withdrawalMinValue: process.env.WAVES_WITHDRAWAL_MIN_VALUE || 10,
                balance: {
                    total: wallet.balance.total.toFixed(2),
                    reader: wallet.balance.reader.toFixed(2),
                    author: wallet.balance.author.toFixed(2),
                    referal: wallet.balance.referal.toFixed(2),
                }
            });
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    }

    getTransactions(req, res, next) {
        Wallet.findOne({owner: req.user}).then(wallet => {
            if (!wallet) return res.sendStatus(404);
            Transaction.find({wallet: wallet}).populate('payment', ['dateFrom', 'dateTo']).sort({createdAt: -1}).then(transactions => {
                if (!transactions) return res.json([]);
                res.json(transactions.map(t => {
                    let data = {    
                        _id: t._id,
                        type: t.type,
                        status: t.status,
                        value: t.value,
                        date: t.payment ? t.payment.dateFrom.getTime() : t.createdAt.getTime(),
                    };
                    if (t.type == transactionType.PAYMENT) {
                        data.readerValue = t.inf.reader;
                        data.authorValue = t.inf.author;
                        data.referalValue = t.inf.referal;
                    };
                    if (t.type == transactionType.WITHDRAWAL) {
                        data.recipient = t.inf.recipient;
                    }
                    return data;
                }));
            });
        });
    }

    async withdrawTokens(req, res, next) {
        let wallet = await Wallet.findOne({owner: req.user});
        if (!wallet) return res.status(400).json({});

        let withdrawalEnabled = !!process.env.WAVES_WITHDRAWAL_ENABLED 
            && wallet.balance.total.greaterThanOrEqualTo(process.env.WAVES_WITHDRAWAL_MIN_VALUE || 10);

        if (!withdrawalEnabled) return res.sendStatus(403);

        let {recipient} = req.body;
        if (!recipient) {
            return res.status(400).json({
                error: errorCode.PAYMENT_WITHDRAW_RECIPIENT_IS_REQUIRED,
                msg: 'Recipient is required'
            });
        };

        try {
            let addressValidationResult = await addressIsValid(recipient);
            if (!addressValidationResult.valid) {
                return res.status(400).json({
                    error: errorCode.PAYMENT_WITHDRAW_RECIPIENT_IS_NOT_VALID,
                    msg: 'Recipient is not valid'
                });
            };
        } catch(err) {
            console.log(err);
            res.sendStatus(500);
        }

        let uncompletedTransaction = await Transaction.findOne({
            wallet, 
            type: transactionType.WITHDRAWAL,
            status: {$in: [transactionStatus.NEW, transactionStatus.PENDING, transactionStatus.PROCESSING]}
        });

        if (uncompletedTransaction) {
            return res.status(400).json({
                error: errorCode.PAYMENT_WITHDRAW_IN_PROCESS,
            });
        }

        let transaction = new Transaction({
            wallet,
            type: transactionType.WITHDRAWAL,
            value: wallet.balance.total,
            inf: {
                recipient: req.body.recipient
            }
        });

        await transaction.save();

        try {
            let job = await processTransactionTask(transaction._id);
            res.json(transaction);
        } catch(err) {
            console.log(err);
            res.sendStatus(500);
        }
        
    }

    subscribe(req, res, next) {
        if (req.params.nickname == req.user.nickname) {
            return res.sendStatus(400);
        }
        User.findOne({nickname: req.params.nickname, isActive: true}).then(user => {
            if (!user) return res.sendStatus(404);

            Subscription.findOne({user, subscriber: req.user}).then(subscription => {
                if (!subscription) {
                    let subscription = new Subscription({user, subscriber: req.user});
                    subscription.save().then(() => {
                        res.sendStatus(201);
                    });
                } else if (!subscription.isActive) {
                    subscription.isActive = true;
                    subscription.save().then(() => {
                        res.sendStatus(200);
                    });
                } else {
                    res.sendStatus(200);
                }
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        })
    }

    unsubscribe(req, res, next) {
        if (req.params.nickname == req.user.nickname) {
            return res.sendStatus(400);
        }
        User.findOne({nickname: req.params.nickname, isActive: true}).then(user => {
            if (!user) return res.sendStatus(404);

            Subscription.findOne({user, subscriber: req.user}).then(subscription => {
                if (!subscription) {
                    res.sendStatus(200);
                } else if (subscription.isActive) {
                    subscription.isActive = false;
                    subscription.save().then(() => {
                        res.sendStatus(200);
                    });
                } else {
                    res.sendStatus(200);
                }
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        })
    }

    getSubscribers(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            _getSubscriptionUsers(req, 'subscribers', user).then(result => {
                if (result.error) return res.sendStatus(result.status);
                res.json(result.data);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            })
        })(req, res, next);
    }

    getSubscriptions(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            _getSubscriptionUsers(req, 'subscriptions', user).then(result => {
                if (result.error) return res.sendStatus(result.status);
                res.json(result.data);
            }).catch(err => {
                res.sendStatus(500);
            })
        })(req, res, next);
    }

    init() {
        
        this.router.get('/me', passportedHandler(this.getMe));
        this.router.patch('/me', passportedHandler(
            limiter({
                lookup: 'user._id',
                total: process.env.UPDATE_ME_LIMITER_TOTAL,
                expire: toMs(process.env.UPDATE_ME_LIMITER_EXPIRE)
            }),
            upload.single('avatar'),
            this.updateMe
        ));
        this.router.get('/me/wallet', passportedHandler(this.getWallet));
        this.router.post('/me/wallet/withdraw', passportedHandler(this.withdrawTokens));
        this.router.get('/me/transactions', passportedHandler(this.getTransactions));
        this.router.get('/:nickname', this.getUser);
        this.router.get('/:nickname/subscribers', this.getSubscribers);
        this.router.get('/:nickname/subscriptions', this.getSubscriptions);
        this.router.post('/:nickname/subscribe', passportedHandler(this.subscribe));
        this.router.post('/:nickname/unsubscribe', passportedHandler(this.unsubscribe));
    }
}

export default new UserRouter().router;