import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import User from '../models/UserModel';
import {vkSearchFriends, subscribeFriendsVK} from '../utils/social';

let usernames = process.argv.slice(2);

let query = usernames.length ? 
    User.find({
        username: {$in: usernames, $regex: /^vk\d+$/}, 
        isActive: true
    }, {}, {timeout: true}) : 
    User.find({isActive: true, username: {$regex: /^vk\d+$/}}, {}, {timeout: true});

let cursor = query.cursor();

let count = 0;
let total;

cursor.eachAsync(async user => {
    if (!total) total = await query.count().exec();
    let data = await subscribeFriendsVK(user._id);
    count++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Processed users: ${count} of ${total}`);
}).then(() => {
    console.log('\nTask completed');
    process.exit();
});

