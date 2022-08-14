import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';

import db from '../db';
import {createScoredFeedCache, feedName} from '../utils/cache';

if (!process.argv[2]) {
    console.log('Interval param is required');
    process.exit(1);
}

if (!process.argv[3]) {
    console.log('Feed name is required');
    process.exit(1);
}

let dur = parseDuration(process.argv[2]);
let feed = process.argv[3];
let dateTo = moment();
let dateFrom = moment().subtract(dur / 1000, 'seconds');

createScoredFeedCache(dateFrom.toDate(), dateTo.toDate(), feed).then(count => {
    console.log('Feed cached:', count);
}).catch(err => {
    console.error('Error:', err);
}).then(() => {
    process.exit();
});

