import dotenv from 'dotenv';
dotenv.config();

import BigNumber from 'bignumber.js';
import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {updatePayments, confirmPayment} from '../utils/payments';
import { Rates } from '../models/paymentModels';

if (!process.argv[2]) {
    console.log('Rate param is required');
    process.exit(1);
}

let command = async () => {
    let rates = await Rates.findOne();
    console.log('Current TOKEN/WAVES is ' + rates['TOKEN_WAVES']);
    await Rates.findOneAndUpdate({}, {$set: {TOKEN_WAVES: process.argv[2]}});
    let newRates = await Rates.findOne();
    console.log('TOKEN/WAVES has been updated to ' + newRates['TOKEN_WAVES']);
    process.exit();
};

command();