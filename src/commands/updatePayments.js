import dotenv from 'dotenv';
dotenv.config();

import BigNumber from 'bignumber.js';
import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {updatePayments, confirmPayment} from '../utils/payments';

if (!process.argv[2]) {
    console.log('Interval param is required');
    process.exit(1);
}

let tz = process.env.TZ || 'Europe/Moscow';
let dateFrom = moment(process.argv[2]).tz(tz).startOf('day');
let dateTo;
let amount = new BigNumber(1000);
let fake = false;

if (process.argv[3]) {
    dateTo = moment(process.argv[3]).tz(tz).startOf('day');
} else {
    dateTo = dateFrom.clone();
    dateTo.add(1, 'days');
}

if (process.argv[4]) {
    amount = new BigNumber(process.argv[4]);
}

dateFrom = dateFrom.toDate();
dateTo = dateTo.toDate();

console.log(dateFrom, dateTo);

if (process.argv[5] == 'fake') {
    fake = true;
}

updatePayments(dateFrom, dateTo, amount, fake).then(payment => {
    console.log('Payment created:', payment._id);
    confirmPayment(payment._id).then(() => {
        console.log('Payment confirmed');
        process.exit();
    }).catch(err => {
        console.log(err);
    });
}).catch(err => {
    console.log(err);
});

