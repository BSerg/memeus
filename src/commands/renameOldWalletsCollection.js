import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import mongoose from 'mongoose';

import db from '../db';

let command = async () => {
    await db.collection('wallets').rename('_wallets');
    await db.collection('transactions').rename('_transactions');
    process.exit();
};

command();