import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import uuid from 'uuid';

import User from '../models/UserModel';
import db from '../db';

let count = Math.min(process.argv[2], 1000) || 100;

let processes = [];

for (let i = 0; i < count; i++) {
    let name = 'test' + uuid.v4().replace('-', '').slice(0, 20);
    let user = new User({
        username: name,
        nickname: name,
        isActive: true 
    });
    processes.push(
        user.save().then(() => {
            console.log('User created:', i + 1 , 'of', count);
        })
    )
    

}

Promise.all(processes).then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
})
