import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';

import { Wallet } from "../models/paymentModels";
import { BigNumber } from 'bignumber.js';

let command = async () => {
    let totalTokens = new BigNumber(0);

    let wallets = await Wallet.find({$where: "this.balance.total >= " + (process.env.WAVES_WITHDRAWAL_MIN_VALUE || 10)});
    for (let i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        totalTokens = totalTokens.plus(wallet.balance.total);
    }

    console.log('Wallets count: ' + wallets.length);
    console.log('Total tokens: ' + totalTokens);

    process.exit();
};

command();