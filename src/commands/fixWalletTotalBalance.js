import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {getReferalPayments, getUsersPaymentShares, getAuthorsPaymentShares} from '../utils/payments';
import {round} from '../utils';
import User from '../models/UserModel';
import Wallet, {Transaction, transactionType} from '../models/WalletModel';

import db from '../db';

Wallet.find().then(wallets => {
    if (wallets) {
        let count = 0;
        wallets.forEach(wallet => {
            wallet.balance.total = round(wallet.balance.reader + wallet.balance.author + wallet.balance.referal);
            wallet.save();
            count++;
            console.log(`${wallet.balance.total} == ${wallet.balance.reader} + ${wallet.balance.author} + ${wallet.balance.referal}`)
            console.log('Wallet processed: ', count, 'of', wallets.length);
        });
    }
});