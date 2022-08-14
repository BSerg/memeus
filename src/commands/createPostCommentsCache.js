import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import moment from 'moment';
import parseDuration from 'parse-duration';

import Post, {postStatus} from '../models/PostModel';
import {createPostCommentsCache, createPostCommentsCountCache, getCacheKey, client} from '../utils/cache';

import db from '../db';

let query = Post.find({status: postStatus.PUBLISHED});

let postSlugs = process.argv.slice(2);

if (postSlugs.length) {
    query = query.where('slug').in(postSlugs);
}

let cursor = query.cursor();

let total;
let count = 0;

cursor.on('data', async post => {
    if (!total) total = await query.count().exec();
    await createPostCommentsCache(post._id);
    await createPostCommentsCountCache(post._id);
    count++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Post comments cached. Posts processed ${count} of ${total}`);
});

cursor.on('close', () => {
    setTimeout(() => {
        process.exit(0);
    }, 30000)
});
