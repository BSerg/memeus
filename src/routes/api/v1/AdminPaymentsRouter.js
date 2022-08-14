import {Router, Request, Response, NextFunction} from 'express';
import multer from 'multer';
import passport from 'passport';
import toMs from 'parse-duration';
import moment from 'moment'

import {passportedHandler, checkIsAdmin} from '../../handlers';
import {client as redisClient, getCacheKey} from '../../../utils/cache';
import {updatePayments, confirmPayment} from '../../../utils/payments';
import {Payment, paymentStatus, paymentType, Transaction, Rates} from '../../../models/paymentModels';
import { BigNumber } from 'bignumber.js';
import { errorCode } from '../../../utils/constants';
import { setTimeout } from 'timers';

export class AdminPaymentsRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getPayments(req, res, next) {

        Payment.aggregate([
            {$lookup: {
                from: 'transactions',
                localField: '_id',
                foreignField: 'payment',
                as: 'transactions'
            }},
            {$unwind: '$transactions'},
            {$group: {
                _id: "$_id",
                prevPayment: {$first: "$prevPayment"},
                dateFrom: {$first: "$dateFrom"},
                dateTo: {$first: "$dateTo"},
                tokenAmount: {$first: "$tokenAmount"},
                sharedTokenAmount: {$first: "$sharedTokenAmount"},
                status: {$first: "$status"},
                progress: {$first: "$progress"},
                transactionsCount: {$sum: 1}
            }},
            {$sort: {dateFrom: 1}}
        ], (err, result) => {
            res.json(result);
        });
    }

    createPayment(req, res, next) {
        if (!req.body.dateFrom || !req.body.dateTo || !req.body.amount) return res.sendStatus(400);

        let tz = process.env.TZ || 'Europe/Moscow';
        let dateFrom = moment(req.body.dateFrom).tz(tz).startOf('day');
        let dateTo = moment(req.body.dateTo).tz(tz).startOf('day');
        let amount = new BigNumber(req.body.amount);

        dateFrom = dateFrom.toDate();
        dateTo = dateTo.toDate();

        updatePayments(dateFrom, dateTo, amount).then(async payment => {
            let transactionsCount = await Transaction.find({payment}).count();
            payment.transactionsCount = transactionsCount;
            res.json(payment);
        }).catch(err => {
            console.log(err);
            if (err.error == errorCode.CREATE_PAYMENT_START_DATE_MUST_BE_EQUAL_END_DATE_OF_PREV_PAYMENT) {
                res.status(400).json(err);
            }
            res.sendStatus(500);
        });
    }

    confirmPayment(req, res, next) {
        let payment = Payment.findById(req.params.paymentId).then(payment => {
            if (!payment) return res.sendStatus(404);
            confirmPayment(payment._id).then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                if (err.error == errorCode.CONFIRM_PAYMENT_STATUS_NOT_ALLOWED) {
                    res.status(400).json(err);
                }
                res.sendStatus(500);
            });
        });
    }

    async getTransactions(req, res, next) {
        let {wallet, payment, page, pageSize} = req.query;
        page = Math.max(1, parseInt(page));
        pageSize = Math.max(5, Math.min(100, parseInt(pageSize)));
        let query = Transaction.find();
        if (wallet) query = query.where('wallet').equals(wallet);
        if (payment) query = query.where('payment').equals(payment);
        let transactions = await query.sort({_id: -1}).skip(page - 1).limit(page * pageSize).exec();
        res.json(transactions);
    }

    async getRates(req, res, next) {
        let rates = await Rates.findOne();
        res.json(rates);
    }

    async updateRates(req, res, next) {
        let rates = await Rates.findOneAndUpdate({}, {...req.body});
        res.sendStatus(200);
    }

    init() {
        this.router.get('/', checkIsAdmin, this.getPayments);
        this.router.post('/', checkIsAdmin, this.createPayment);
        this.router.get('/transactions', checkIsAdmin, this.getTransactions);
        this.router.get('/rates', checkIsAdmin, this.getRates);
        this.router.patch('/rates', this.updateRates);
        this.router.patch('/:paymentId/confirm', checkIsAdmin, this.confirmPayment);
    }
}

export default new AdminPaymentsRouter().router;