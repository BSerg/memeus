import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import User from '../models/UserModel';
import Wallet, {Transaction} from '../models/WalletModel';

import db from '../db';

Wallet.collection.remove();
Transaction.collection.remove();

console.log('Payments are dropped');

process.exit();