import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import mongoose from 'mongoose';
import round from 'mongo-round';

import db from '../db';

import {default as _Wallet, Transaction as _Transaction} from '../models/WalletModel';
import {Wallet, Transaction, transactionType, transactionStatus, Payment, paymentStatus} from '../models/paymentModels';
import { BigNumber } from 'bignumber.js';

let migrateTransactions = async walletId => {
    return await _Transaction.aggregate([
        {$match: {wallet: walletId}},
        {$project: {
            wallet: 1,
            type: 1,
            dateFrom: 1,
            dateTo: 1,
            value: 1,
            createdAt: 1,
        }},
        {$group: {
            _id: "$dateFrom",
            walletId: {$first: "$wallet"},
            dateFrom: {$first: "$dateFrom"},
            dateTo: {$first: "$dateTo"},
            total: {$sum: "$value"},
            reader: {$sum: {$cond: [{$eq: ["$type", 1]}, "$value", 0]}},
            author: {$sum: {$cond: [{$eq: ["$type", 2]}, "$value", 0]}},
            referal: {$sum: {$cond: [{$eq: ["$type", 3]}, "$value", 0]}},
        }},
        {$project: {
            walletId: 1,
            dateFrom: 1,
            dateTo: 1,
            total: round("$total", 2),
            reader: round("$reader", 2),
            author: round("$author", 2),
            referal: round("$referal", 2),
        }},
        {$sort: {dateFrom: 1}}
    ]);
};

let command = async () => {

    console.log('Rename collections');
    try {
        await db.collection("wallets").rename('_wallets');
    } catch(err) {}
    try {
        await db.collection("transactions").rename('_transactions');
    } catch(err) {}

    await new Promise((resolve, reject) => {setTimeout(() => {resolve()}, 1000)});

    let walletMap = {};

    let _wallets = await _Wallet.find();

    for (let i = 0; i < _wallets.length; i++) {
        let _wallet = _wallets[i];

        let wallet = new Wallet({
            owner: _wallet.owner,
            address: _wallet.address,
            oldWalletId: _wallet._id
        });
        // wallet.balance.total = new BigNumber(_wallet.balance.total.toFixed(8)).dividedBy(100);
        // wallet.balance.reader = new BigNumber(_wallet.balance.reader.toFixed(8)).dividedBy(100);
        // wallet.balance.author = new BigNumber(_wallet.balance.author.toFixed(8)).dividedBy(100);
        // wallet.balance.referal = new BigNumber(_wallet.balance.referal.toFixed(8)).dividedBy(100);
        await wallet.save();

        let payments = await migrateTransactions(_wallet._id);

        for (let _payment of payments) {
            let payment = await Payment.getOrCreate(
                {dateFrom: _payment.dateFrom, dateTo: _payment.dateTo}, 
                {dateFrom: _payment.dateFrom, dateTo: _payment.dateTo}
            )

            let transaction = new Transaction({
                payment,
                wallet,
                type: transactionType.PAYMENT,
                value: new BigNumber(_payment.total).dividedBy(100),
                inf: {
                    reader: new BigNumber(_payment.reader).dividedBy(100),
                    author: new BigNumber(_payment.author).dividedBy(100),
                    referal: new BigNumber(_payment.referal).dividedBy(100),
                },
                status: transactionStatus.COMPLETED
            });

            payment.sharedTokenAmount = payment.sharedTokenAmount.plus(transaction.value);
            await payment.save();

            await transaction.save();
        }

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Processed wallets: ${i+1} of ${_wallets.length}`);
    }

    await Payment.update({}, {$set: {status: paymentStatus.COMPLETED}}, {multi: true});
    
    // Check balances
    let wallets = await Wallet.find();

    for (let i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let oldWallet = await _Wallet.findById(wallet.oldWalletId);
        if (!wallet.balance.total.times(100).equals(oldWallet.balance.total.toFixed(8))) {
            console.log('WALLET BALANCE PROBLEM', wallet._id);
        }
    };

    process.exit();
};

command();