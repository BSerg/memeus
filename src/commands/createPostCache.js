import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import moment from 'moment';
import parseDuration from 'parse-duration';

import Post, {postStatus} from '../models/PostModel';
import {cachePost, getCacheKey, client} from '../utils/cache';

import db from '../db';


let dur = process.argv[2] ? parseDuration(process.argv[2]) : 1 * 60 * 60 * 1000;

let date = moment().subtract(dur / 1000, 'seconds');

let cursor = Post.find({status: {$in: [postStatus.NEW, postStatus.PUBLISHED]}, createdAt: {$gte: date}}).cursor();

let count = 0;

cursor.on('data', post => {
    client.exists(getCacheKey('p', post.slug), (err, exists) => {
        if (!err && !exists) {
            cachePost(post._id).then(() => {
                count++;
                console.log('Post cached')
            });
        }
    });
});

cursor.on('close', () => {
    console.log('Post cached:', count);
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
