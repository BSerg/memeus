import dotenv from 'dotenv';
dotenv.config();
import polyfill from 'babel-polyfill';

import uuid from 'uuid';

import User from '../models/UserModel';
import db from '../db';

let args = process.argv.slice(2);

let username = args[0];
let password = args[1];
if (!username || !password) {
    process.exit(0);
}

let user = new User({
    username, 
    nickname: username + uuid.v4().replace('-', '').slice(0, 20),
    password,
    isActive: true,
    isAdmin: true,
});

user.save().then(() => {
    console.log('User created: ' + username);
    process.exit(0);
}).catch((err) => {
    console.log('User error: ' + err);
    process.exit(1);
});
