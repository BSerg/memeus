import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import User from '../models/UserModel';
import {vkSearchFriends, subscribeFriendsTwitter} from '../utils/social';

let usernames = process.argv.slice(2);

let query = usernames.length ? 
    User.find({
        username: {$in: usernames, $regex: /^twitter\d+$/}, 
        isActive: true
    }, {}, {timeout: true}) : 
    User.find({isActive: true, username: {$regex: /^twitter\d+$/}}, {}, {timeout: true});

let cursor = query.cursor();

let count = 0;
let total;

let processUser = async user => {
    if (!total) total = await query.count().exec();
    try {
        let data = await subscribeFriendsTwitter(user._id);
        count++;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Processed users: ${count} of ${total}`);
    } catch(err) {
        if (err[0] && err[0].code == 88) {
            console.log('Rate limit exceeded. Waiting for 5 minutes...')
            await new Promise((resolve, reject) => {setTimeout(resolve, 5 * 60 * 1000)});
            await processUser(user);
        }
    }
    
};

cursor.eachAsync(processUser).then(() => {
    console.log('\nTask completed');
    process.exit();
});

