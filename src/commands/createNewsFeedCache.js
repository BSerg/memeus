import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import News from '../models/NewsModel';
import {createNewsFeedCache} from '../utils/cache';


createNewsFeedCache().then(res => {
    console.log('News feed cached:', res);
    process.exit();
});