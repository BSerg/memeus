import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {getOldPostStats} from '../utils/stats';
import {round} from '../utils';
import User from '../models/UserModel';
import Wallet, {Transaction, transactionType} from '../models/WalletModel';

import db from '../db';

if (!process.argv[2]) {
    console.log('dateFrom required');
    process.exit(1);
}

let tz = process.env.TZ || 'Europe/Moscow';

let dateFrom = moment(process.argv[2]).tz(tz).startOf('day'), dateTo, amount = 100000;
if (process.argv[3]) {
    dateTo = moment(process.argv[3]).tz(tz).startOf('day');
} else {
    dateTo = dateFrom.clone();
    dateTo.add(1, 'days');
} 

dateFrom = dateFrom.toDate();
dateTo = dateTo.toDate();

getOldPostStats(dateFrom, dateTo).then(res => {
    res.forEach(item => {
        console.log(`https://memeus.ru/m/${item._id},${item.marks},${item.likes}`);
    });
})