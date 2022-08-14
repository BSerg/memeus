import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import {createFeedCache} from '../utils/cache';

createFeedCache().then(count => {
    console.log('Feed cached:', count);
}).catch(err => {
    console.error('Error:', err);
}).then(() => {
    process.exit();
});

