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


let task = async () => {
    let wallets = await Wallet.find();
    if (!wallets) return;
    let count = 0;
    for (let i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        wallet.balance.total *= 100;
        wallet.balance.reader *= 100;
        wallet.balance.author *= 100;
        wallet.balance.referal *= 100;
        await wallet.save();
        await Transaction.update({wallet: wallet}, {$mul: {'value': 100}}, {multi: true});
        count++;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Wallet processed: ' + count + ' of ' + wallets.length);
    };
};

task().then(() => {
    process.exit();
});