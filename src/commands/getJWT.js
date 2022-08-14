import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import {signJWT} from '../utils';
import User from '../models/UserModel';
import db from '../db';


if (!process.argv[2]) {
    console.error('Username is required');
    process.exit(1);
} else {
    let username = process.argv[2];
    User.findOne({username}).then(user => {
        console.log(signJWT(user.getPayload()));
        process.exit();
    });
}