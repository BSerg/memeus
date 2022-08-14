import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import User from '../models/UserModel';
import {createUserPostList, createUserPostListPublic} from '../utils/cache';

let usernames = process.argv.slice(2);

let query = usernames.length ? 
    User.find({username: {$in: usernames}, isActive: true}, {}, {timeout: true}) : 
    User.find({isActive: true}, {}, {timeout: true});

let cursor = query.cursor();

let count = 0;
let _proc = [];

cursor.on('data', user => {
    _proc.push(createUserPostList(user._id));
    count++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Processed users: ${count}`);
});

cursor.on('close', () => {
    Promise.all(_proc).then(() => {
        console.log('Task completed');
        process.exit();
    });
});