import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import {cacheLikes} from '../utils/cache';
import Post, {postStatus} from '../models/PostModel';

let query = Post.find({status: {$in: [postStatus.PUBLISHED, postStatus.NEW]}});

if (process.argv[2]) {
    query.find({slug: process.argv[2]});
}

let cursor = query.cursor();

let proc = [];

cursor.on('data', post => {
    proc.push(cacheLikes(post._id));
});

cursor.on('close', () => {
    Promise.all(proc).then(() => {
        setTimeout(() => {
        console.log('Likes cached');
        process.exit();
        }, 1000);
    })
});

