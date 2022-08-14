import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import { wavesRateProcess, currencyRateProcess, placeBuyOrder } from './index';

import db from '../db';

currencyRateProcess();
wavesRateProcess();

if (process.env.WAVES_ALLOW_PLACE_ORDER) {
    setInterval(() => {
        placeBuyOrder();
    }, 2 * 60 * 1000);
}
