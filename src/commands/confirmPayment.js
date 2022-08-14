import dotenv from 'dotenv';
dotenv.config();

import BigNumber from 'bignumber.js';
import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {confirmPayment} from '../utils/payments';
import { Payment } from '../models/paymentModels';

if (!process.argv[2]) {
    console.log('Param is required');
    process.exit(1);
}

let payment = Payment.findById(process.argv[2]).then(payment => {
    if (!payment) return res.sendStatus(404);
    confirmPayment(payment._id).then(() => {
        console.log('Payment confirmed');
        process.exit();
    }).catch(err => {
        console.log(err);
    });
});