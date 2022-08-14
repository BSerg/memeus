import moment from 'moment';
import BigNumber from 'bignumber.js';
import request from 'request';

import User from '../models/UserModel';
import {Payment, paymentStatus, paymentType, Wallet, Transaction, transactionType, transactionStatus} from '../models/paymentModels';
import {Visit, PostView} from '../models/statModels';
import {repStatus} from '../models/ReportModel';
import {postStatus, Like} from '../models/PostModel';
import {round, floor, ceil} from '../utils';

import db from '../db';
import { processTransactionTask } from '../queues/tasks/payments';
import { errorCode } from './constants';

export let getUsersPaymentShares = (
    amount,
    dateFrom, 
    dateTo, 
    minVisits = 1, 
    minPostViews = 10, 
    minLikes = 2,
    reportMultiplier = 3
) => {
    return new Promise((resolve, reject) => {
        User.aggregate([
            {$match: {isActive: true}},
            {$lookup: {
                from: "visits",
                localField: "username",
                foreignField: "u",
                as: "visit"
            }},
            {$unwind: "$visit"},
            {$match: {
                "visit.d": {$gte: dateFrom.valueOf(), $lt: dateTo.valueOf()},
            }},
            {$group: {
                _id: "$username",
                userId: {$first: "$_id"},
                visits: {$sum: 1},
            }},
            {$lookup: {
                from: "postViews",
                localField: "_id",
                foreignField: "u",
                as: "postView"
            }},
            {$unwind: "$postView"},
            {$match: {
                "postView.d": {$gte: dateFrom.valueOf(), $lt: dateTo.valueOf()}
            }},
            {$group: {
                _id: "$_id",
                userId: {$first: "$userId"},
                visits: {$first: "$visits"},
                views: {$sum: 1},
            }},
            {$lookup: {
                from: "likes",
                localField: "userId",
                foreignField: "user",
                as: "like"
            }},
            {$unwind: {path: "$like", preserveNullAndEmptyArrays: true}},
            {$match: {
                "like.createdAt": {$gte: dateFrom, $lt: dateTo}
            }},
            {$group: {
                _id: "$_id",
                userId: {$first: "$userId"},
                visits: {$first: "$visits"},
                views: {$first: "$views"},
                likes: {$sum: 1}
            }},
            {$match: {
                visits: {$gte: minVisits},
                views: {$gte: minPostViews},
                likes: {$gte: minLikes}
            }},
            {$lookup: {
                from: "reports",
                localField: "userId",
                foreignField: "user",
                as: "report"
            }},
            {$unwind: {path: "$report", preserveNullAndEmptyArrays: true}},
            {$group: {
                _id: "$_id",
                userId: {$first: "$userId"},
                visits: {$first: "$visits"},
                views: {$first: "$views"},
                likes: {$first: "$likes"},
                reports: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    {$eq: ["$report.status", repStatus.ACCEPTED]},
                                    {$gte: ["$report.createdAt", dateFrom]},
                                    {$lt: ["$report.createdAt", dateTo]},
                                ]
                            }, 1, 0
                        ]
                    }
                }
            }},
            {$project: {
                _id: 1,
                userId: 1,
                visits: 1,
                views: 1,
                likes: 1,
                reports: 1,
                points: {$cond: [{$gt: ["$reports", 0]}, reportMultiplier, 1]}
            }},
            {$sort: {points: -1, likes: -1, views: -1, visits: -1}},
            {$group: {
                _id: null,
                usernames: {$push: "$_id"},
                userIds: {$push: "$userId"},
                points: {$push: "$points"},
                total: {$sum: "$points"}
            }},
            {$project: {
                usernames: 1,
                points: 1,
                userIds: 1,
                shares: {$map: {input: "$points", as: "p", in: {$divide: ["$$p", "$total"]}}}
            }}
            
        ], (err, result) => {
            if (err) return reject(err);
            if (!result.length) {
                return resolve(null);
            }
            let {usernames, points, userIds, shares} = result[0];
            let _result = [];
            let _sum = new BigNumber(0);
            let _count = 0;
            usernames.forEach((username, index) => {
                let share =  BigNumber(shares[index].toFixed(15)).times(amount).round(8, BigNumber.ROUND_FLOOR);
                _sum = _sum.plus(share).round(8, BigNumber.ROUND_FLOOR);
                if (share >= 0) {
                    _result.push({username, userId: userIds[index], share})
                    _count++;
                }
            });
            resolve({
                sharedAmount: _sum,
                sharedCount: _count,
                count: usernames.length,
                shares: _result
            });
        });
    });
};

export let getAuthorsPaymentShares = (amount, dateFrom, dateTo, minLikes = 5) => {
    return new Promise((resolve, reject) => {
        Like.aggregate([
            {$match: {createdAt: {$gte: dateFrom, $lt: dateTo}}},
            {$lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post"
            }},
            {$lookup: {
                from: "users",
                localField: "post.author",
                foreignField: "_id",
                as: "author"
            }},
            {$unwind: "$post"},
            {$unwind: "$author"},
            {$match: {"post.status": postStatus.PUBLISHED, "post.publishedAt": {$lt: moment(dateFrom).add(2, 'days').toDate()}}},
            {$group: {
                _id: "$author.username",
                userId: {$first: "$post.author"},
                likes: {$sum: "$value"}
            }},
            {$match: {likes: {$gte: minLikes}}},
            {$sort: {likes: -1}},
            {$group: {
                _id: null,
                usernames: {$push: "$_id"},
                userIds: {$push: "$userId"},
                likes: {$push: "$likes"},
                total: {$sum: "$likes"}
            }},
            {$project: {
                usernames: 1,
                userIds: 1,
                likes: 1,
                shares: {$map: {input: "$likes", as: "l", in: {$divide: ["$$l", "$total"]}}}
            }}
        ], (err, result) => {
            if (err) return reject(err);
            if (!result.length) {
                return resolve(null);
            }
            let {usernames, userIds, likes, shares} = result[0];
            let _result = [];
            let _sum = new BigNumber(0);
            let _count = 0;
            usernames.forEach((username, index) => {
                let share =  BigNumber(shares[index].toFixed(15)).times(amount).round(8, BigNumber.ROUND_FLOOR);
                _sum = _sum.plus(share).round(8, BigNumber.ROUND_FLOOR);
                if (share >= 0) {
                    _result.push({username, userId: userIds[index],  share})
                    _count++;
                }
            });
            resolve({
                sharedAmount: _sum,
                sharedCount: _count,
                count: usernames.length,
                shares: _result
            });
        });
    });
};

export let getReferalPaymentShares = (_shares, referalTax = 0.05) => {
    return new Promise((resolve, reject) => {
        let concShares = {}, shares = {};

        _shares.forEach(item => {
            concShares[item.username] = concShares[item.username] || new BigNumber(0);
            concShares[item.username] = concShares[item.username].plus(item.share);
        });

        User.aggregate([
            {$match: {isActive: true}},
            {$lookup: {
                from: "users",
                localField: "invitedBy",
                foreignField: "_id",
                as: "referal"
            }},
            {$match: {"referal.isActive": true}},
            {$unwind: "$referal"},
            {$project: {
                username: 1,
                userId: "$_id",
                referal: "$referal.username"
            }}
        ], (err, result) => {
            if (err) return reject(err);
            let sharedAmount = new BigNumber(0);
            result.forEach(item => {
                if (concShares[item.username]) {
                    let referalAward = BigNumber(concShares[item.username].toFixed(15)).times(referalTax).round(8, BigNumber.ROUND_FLOOR);
                    if (referalAward > 0) {
                        sharedAmount = sharedAmount.plus(referalAward);
                        shares[item.referal] = shares[item.referal] || new BigNumber(0);
                        shares[item.referal] = shares[item.referal].plus(referalAward);
                    }
                }
            });
            resolve({sharedAmount, shares});
        })
    });
};

export let updatePayments = async (dateFrom, dateTo, amount = new BigNumber(1000), fake = false) => {
    const _readerShare = 0.34, _authorShare = 0.54, _referalShare = 0.02; // Referal share is 2%, expected max 40% of invited users
    
    let prevPayment = null;

    if (!fake) {
        prevPayment = await Payment.findOne().sort({dateFrom: -1}).exec();
        if (prevPayment && prevPayment.dateTo != dateFrom.toString()) {
            throw {
                error: errorCode.CREATE_PAYMENT_START_DATE_MUST_BE_EQUAL_END_DATE_OF_PREV_PAYMENT,
                msg: 'Previous payment exists and it has different dateTo value than has been passed'
            }
        }
    }
    
    let readerShares = await getUsersPaymentShares(amount.times(_readerShare), dateFrom, dateTo);
    console.log('Reader payments calculated');
    
    let authorShares = await getAuthorsPaymentShares(amount.times(_authorShare), dateFrom, dateTo);
    console.log('Author payments calculated');

    let payments = [];
    if (readerShares) payments = payments.concat(readerShares.shares);
    if (authorShares) payments = payments.concat(authorShares.shares);
    let referalShares = await getReferalPaymentShares(payments);
    console.log('Referal payments calculated');

    let data = {}, totalSharedAmount = new BigNumber(0);
    let defaultDataItem = {
        total: new BigNumber(0),
        reader: new BigNumber(0),
        author: new BigNumber(0),
        referal: new BigNumber(0),
    };

    readerShares && readerShares.shares.forEach(share => {
        if (!data[share.username]) data[share.username] = {...defaultDataItem};
        data[share.username].total = data[share.username].total.plus(share.share);
        data[share.username].reader = data[share.username].reader.plus(share.share);
    });

    authorShares && authorShares.shares.forEach(share => {
        if (!data[share.username]) data[share.username] = {...defaultDataItem};
        data[share.username].total = data[share.username].total.plus(share.share);
        data[share.username].author = data[share.username].author.plus(share.share);
    });

    for (let username in referalShares.shares) {
        if (!data[username]) data[username] = {...defaultDataItem};
        data[username].total = data[username].total.plus(referalShares.shares[username]);
        data[username].referal = data[username].referal.plus(referalShares.shares[username]);
    };

    let sharedTokenAmount = new BigNumber(0);
    if (readerShares) sharedTokenAmount = sharedTokenAmount.plus(readerShares.sharedAmount);
    if (authorShares) sharedTokenAmount = sharedTokenAmount.plus(authorShares.sharedAmount);
    if (referalShares) sharedTokenAmount = sharedTokenAmount.plus(referalShares.sharedAmount);

    let payment = new Payment({
        prevPayment, dateFrom, dateTo, 
        tokenAmount: amount.times(new BigNumber(_readerShare).plus(_authorShare).plus(_referalShare)),
        sharedTokenAmount: sharedTokenAmount,
    });

    for(let username in data) {
        let user = await User.findOne({username});
        let wallet = await Wallet.findOneOrCreate({owner: user}, {owner: user})
        let transaction = new Transaction({
            payment, 
            wallet,
            type: transactionType.PAYMENT,
            value: data[username].total,
            inf: {
                reader: data[username].reader,
                author: data[username].author,
                referal: data[username].referal
            }
        });
        await transaction.save();
    }
    await payment.save();
    return payment;
};

export let confirmPayment = async paymentId => {
    let payment = await Payment.findById(paymentId).populate('prevPayment');
    
    if (!payment) throw 'Payment not found';
    if (payment.status == paymentStatus.IN_PROGRESS) throw {error: errorCode.CONFIRM_PAYMENT_STATUS_NOT_ALLOWED, msg: 'Payment in process already'};
    if (payment.status == paymentStatus.COMPLETED) throw {error: errorCode.CONFIRM_PAYMENT_STATUS_NOT_ALLOWED, msg: 'Payment completed'};

    let transactions = await Transaction.find({payment});

    for (let i = 0; i < transactions.length; i++) {
        // TODO: real token transfer to system wallet in future...
        let transaction = transactions[i];
        transaction.status = transactionStatus.COMPLETED;
        await transaction.save();
    }

    payment.status = paymentStatus.COMPLETED;
    await payment.save();
};

let watchCurrencyProcess = null;
let watchWavesProcess = null;

let getCurrencyRate = () => {
    return new Promise((resolve, reject) => {
        const URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
        request.get(URL, {json: true}, (err, res, body) => {
            if (err) return reject(err);
            if (res && res.statusCode == 200) {
                resolve(body);
            } else {
                return reject(res.statusCode);
            }
        });
    });
}

export let watchFiatCurrencyRate = (callback, interval = 1 * 60 * 1000) => {
    watchCurrencyProcess = setInterval(() => {
        getCurrencyRate().then(res => {
            callback(res);
        }).catch(err => {
            console.log(err);
        });
    }, interval);
};

export let stopWatchFiatCurrencyRate = () => {
    clearInterval(watchCurrencyProcess);
};

export let getWavesRate = () => {
    const url = 'https://api.coinmarketcap.com/v1/ticker/WAVES/?convert=USD';
    return new Promise((resolve, reject) => {
        request.get(url, {json: true}, (err, res, body) => {
            if (err) return reject(err);
            if (res && res.statusCode == 200) {
                resolve(body);
            } else {
                return reject(res.statusCode);
            }
        });
    });
};

export let watchWavesRate = (callback, interval = 1 * 60 * 1000) => {
    watchWavesProcess = setInterval(() => {
        getWavesRate().then(res => {
            callback(res);
        }).catch(err => {
            console.log(err);
        })
    }, interval);
};