import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {getReferalPaymentShares, getUsersPaymentShares, getAuthorsPaymentShares} from '../utils/payments';
import {round} from '../utils';
import User from '../models/UserModel';
import Wallet, {Transaction, transactionType} from '../models/WalletModel';

import db from '../db';

if (!process.argv[2]) {
    console.log('Interval param is required');
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

if (process.argv[4]) {
    amount = parseInt(process.argv[4]);
}

dateFrom = dateFrom.toDate();
dateTo = dateTo.toDate();

let getOrCreateTransaction = async data => {
    let transaction = await Transaction.findOne(data);
    if (!transaction) {
        transaction = new Transaction(data);
        await transaction.save();
        return [transaction, true];
    } else {
        return [transaction, false];
    }
};

let processUserTransactions = async (username, data) => {
    let balance = data[username];
    let user = await User.findOne({username: username, isActive: true});
    
    if (user == null) {
        console.log('User doesn\'t exist or is not active');
        return;
    }

    let wallet = await Wallet.findOneOrCreate({owner: user, isSystem: true}, {owner: user, isSystem: true});

    let transactionsCount = 0;

    if (balance.reader > 0) {
        let [t, created] = await getOrCreateTransaction({
            wallet: wallet._id,
            type: transactionType.READER,
            value: balance.reader,
            dateFrom, dateTo
        });
        created && transactionsCount++;
    }
    if (balance.author > 0) {
        let [t, created] = await getOrCreateTransaction({
            wallet: wallet._id,
            type: transactionType.AUTHOR,
            value: balance.author,
            dateFrom, dateTo
        });
        created && transactionsCount++;
    }
    if (balance.referal > 0) {
        let [t, created] = await getOrCreateTransaction({
            wallet: wallet._id,
            type: transactionType.REFERAL,
            value: balance.referal,
            dateFrom, dateTo
        });
        created && transactionsCount++;
    }
    return transactionsCount;
}

let updatePayments = async (amount, dateFrom, dateTo) => {

    let readerPayments = await getUsersPaymentShares(0.35 * amount, dateFrom, dateTo);
    console.log('Reader payments calculated');
    let authorPayments = await getAuthorsPaymentShares(0.55 * amount, dateFrom, dateTo);
    console.log('Author payments calculated');
    let payments = [];

    if (readerPayments) {
        payments = payments.concat(readerPayments.shares);
    }
    
    if (authorPayments) {
        payments = payments.concat(authorPayments.shares);
    }

    let referalPayments = await getReferalPaymentShares(payments);
    console.log('Referal payments calculated');
    
    let data = {};
    let defaultDataItem = {
        total: 0,
        reader: 0,
        author: 0,
        referal: 0
    };

    readerPayments && readerPayments.shares.forEach(readerPayment => {
        if (!data[readerPayment.username]) data[readerPayment.username] = {...defaultDataItem};
        data[readerPayment.username].total += readerPayment.share;
        data[readerPayment.username].reader += readerPayment.share;
    });

    authorPayments && authorPayments.shares.forEach(authorPayment => {
        if (!data[authorPayment.username]) data[authorPayment.username] = {...defaultDataItem};
        data[authorPayment.username].total += authorPayment.share;
        data[authorPayment.username].author += authorPayment.share;
    });

    for(let username in referalPayments.balances) {
        let referalPaymentValue = referalPayments.balances[username];
        if (referalPaymentValue != 0) {
            if (!data[username]) data[username] = {...defaultDataItem};
        }
        if (referalPaymentValue > 0) {
            data[username].total += referalPaymentValue;
            data[username].referal += referalPaymentValue;
        } else if (referalPaymentValue < 0) {
            data[username].total += referalPaymentValue;                
            let _readerBalance = data[username].reader;
            let _authorBalance = data[username].author;
            if (_readerBalance + _authorBalance != 0) {
                if (_readerBalance >= _authorBalance) {
                    let _readerBalanceRatio = _readerBalance / (_readerBalance + _authorBalance);
                    data[username].reader = Math.round(data[username].reader + _readerBalanceRatio * referalPaymentValue);
                    data[username].author = data[username].total - data[username].reader;
                } else {
                    let _authorBalanaceRatio = _authorBalance / (_readerBalance + _authorBalance);
                    data[username].author = Math.round(data[username].author + _authorBalanaceRatio * referalPaymentValue);
                    data[username].reader = data[username].total - data[username].author;
                }
            }
        }
    }

    let createdTransactionCount = 0;
    let _proc = [];

    for (let username in data) {
        _proc.push(processUserTransactions(username, data).then(count => {
            createdTransactionCount += count;
        }));
    }

    Promise.all(_proc).then(() => {
        console.log('Transactions created:', createdTransactionCount);
        console.log('Check wallets...');
        let success = true;
        Wallet.find().then(wallets => {
            if (!wallets) {
                console.log('There are no wallets');
                process.exit();
            } else {
                wallets.forEach(wallet => {
                    if (wallet.balance.total != wallet.balance.reader + wallet.balance.author + wallet.balance.referal) {
                        console.log('Wallet balance problem found:', wallet);
                        success = false;
                    }
                })
            }
            
        });
        if (success) {
            console.log('Task completed successfully');
        } else {
            console.log('Task completed with some problems');
        }
        process.exit();
    })
    
};

updatePayments(amount, dateFrom, dateTo);

