import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import Queue from 'bull';

import Post, {Media, postStatus} from '../models/PostModel';
import User, {Avatar} from '../models/UserModel';
import Comment, {commentStatus, CommentMedia} from '../models/CommentModel';
import {Wallet, Transaction, transactionType, transactionStatus} from '../models/paymentModels';
import {createAccount, transfer} from '../utils/waves';
import db from '../db';
import { paymentsTask } from './tasks/payments';
import { Buffer } from 'buffer';

export const procRoute = {
    POST: 'post',
    AVATAR: 'avatar',
    COMMENT: 'comment'
}

export let mediaProcessingBroker = () => {
    let resultQueue = new Queue(process.env.RESULT_QUEUE, process.env.REDIS_URL);
    
    resultQueue.on('completed', (job, result) => {
        console.log('RESULT COMPLETED', job.id, result);
    });
    
    resultQueue.on('error', (job, result) => {
        console.log('RESULT ERROR', job.id, result);
    });
    
    resultQueue.on('failed', err => {
        console.log(err);
    });
    
    resultQueue.process((job, done) => {
    
        switch (job.data.route) {
            case procRoute.POST:
                Post.findById(job.data.postId).populate('author').exec((err, post) => {
                    if (err) done(err);
                    if (post === null) {
                        done('Post not found');
                    } else {
                        if (job.data.error) {
                            post.status = postStatus.ERROR;
                            post.save(err => {
                                if (err) done(err);
                                done(null, post);
                            });
                        } else {
                            let _media = {
                                preview: job.data.preview, 
                                default: job.data.default,
                                original: job.data.original,
                                type: job.data.type
                            };
                            post.media[job.data.mediaIndex] = Media(_media);
                            post.status = postStatus.PUBLISHED;
                            post.publishedAt = new Date();
                            post.save(err => {
                                if (err) done(err);
                                done(null, post);
                            });
                        }
                    }
                });
                break;
            case procRoute.AVATAR:
                User.findById(job.data.userId).then(user => {
                    if (user == null) {
                        done('User not found');
                    } else {
                        if (job.data.error) {
                            done(job.data.error);
                        } else {
                            user.avatar = Avatar({...user.avatar, ...job.data.default});
                            user.save(err => {
                                if (err) done(err);
                                done(null, user)
                            })
                        }
                    }
    
                }).catch(err => {
                    done(err);
                });
            case procRoute.COMMENT:
                Comment.findById(job.data.commentId).then(comment => {
                    if (comment == null) return done('Comment not found');
                    if (job.data.error) {
                        comment.status = commentStatus.ERROR;
                        comment.save().then(() => {
                            done(null, comment);
                        }).catch(err => {
                            done(err);
                        });
                    } else {
                        let _media = {
                            preview: job.data.preview, 
                            default: job.data.default,
                            original: job.data.original,
                            type: job.data.type
                        };
                        comment.media[job.data.mediaIndex] = CommentMedia(_media);
                        comment.status = commentStatus.PUBLISHED;
                        comment.publishedAt = new Date();
                        comment.save(err => {
                            if (err) done(err);
                            done(null, comment);
                        });
                    }
                }).catch(err => {
                    done(err);
                });
        }
    });    
    console.log('Media processing broker has started');
};

export let paymentsBroker = () => {

    let paymentsQueue = new Queue(process.env.PAYMENTS_QUEUE || 'paymentsProcessing', {
        redis: {
            host: process.env.REDIS_HOST, 
            port: process.env.REDIS_PORT, 
            db: process.env.REDIS_DB, 
            password: process.env.REDIS_PASSWORD
        },
        settings: {
            lockDuration: process.env.PAYMENTS_QUEUE_LOCK_DURATION || 30000
        }
    });

    paymentsQueue.on('completed', (job, result) => {
        console.log('PAYMENT JOB COMPLETED', job.id, job.data, result);
    });
    
    paymentsQueue.on('error', (job, result) => {
        console.log('PAYMENT JOB ERROR', job.id, result);
    });
    
    paymentsQueue.on('failed', err => {
        console.log(err);
    });

    paymentsQueue.process(async (job, done) => {

        switch(job.data.route) {
            
            case paymentsTask.CREATE_ACCOUNT:
                let account = await createAccount();
                let wallet = await Wallet.findById(job.data.walletId);
                if (!wallet) return done('Wallet not found');
                if (!wallet.address) {
                    wallet.address = account.address;
                    try {
                        await wallet.save();
                        done(null, wallet.address);
                    } catch(err) {
                        done(err);
                    }                     
                }
                break;

            case paymentsTask.PROCESS_TRANSACTION:
                let transaction = await Transaction.findById(job.data.transactionId).populate('wallet', 'address');
                if (!transaction) return done('Transaction not found');
                // Address is not required now... Because we do not keep balances in blockchain!
                // if (!transaction.wallet.address) return done('Transaction wallet doesn\'t have address'); 
                switch (transaction.type) {
                    
                    case transactionType.WITHDRAWAL:
                        let _transaction;
                        try {
                            _transaction = await transfer(
                                process.env.WAVES_NODE_MAIN_ADDRESS, 
                                transaction.inf.recipient, 
                                transaction.value.times(100000000).toNumber(),
                                transaction.inf
                            );
                        } catch(err) {
                            console.log(err);
                            transaction.status = transactionStatus.FAILED;
                            transaction.inf.error = JSON.stringify(err);
                            transaction.markModified('inf.error');
                            await transaction.save();
                            done(err);
                            return;
                        }
                        if (_transaction.error) {
                            transaction.status = transactionStatus.FAILED;
                            transaction.inf.error = _transaction.error;
                            transaction.markModified('inf.error');
                            await transaction.save();
                            done(_transaction);
                            return;
                        }
                        transaction.status = transactionStatus.COMPLETED;
                        transaction.inf.transaction = _transaction;
                        transaction.markModified('inf.transaction');
                        await transaction.save();
                        done(null, transaction);
                        break;
                    
                    default:
                        console.log('Oops! Unexpected transaction type');
                        done('Oops! Unexpected transaction type');
                }

                break;

        }   
    });

    console.log('Payments broker has started');
};