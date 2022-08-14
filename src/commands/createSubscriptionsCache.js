import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import User, {Subscription} from '../models/UserModel';
import {cacheSubscription} from '../utils/cache';

let query = Subscription.find({isActive: true}, {}, {timeout: true});
let cursor = query.cursor();

let count = 0;
let total;

cursor.eachAsync(async sub => {
    if (!total) total = await query.count().exec();
    await cacheSubscription(sub._id);
    count++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Processed subscriptions: ${count} of ${total}`);
}).then(() => {
    console.log('\nTask completed');
    process.exit();
});

