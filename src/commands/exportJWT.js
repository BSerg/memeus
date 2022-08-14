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
    console.error('Output file path is required');
    process.exit(1);
} else {
    let _path = process.argv[2];
    let count = 0;
    mkdirp(path.dirname(_path), (err, res) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        fs.unlink(_path, err => {
            let out = fs.createWriteStream(_path, {flags: 'a'});
            User.find({isActive: true}).then(users => {
                if (users) {
                    Promise.all(
                        users.map(user => {
                            return new Promise((resolve, reject) => {
                                let jwt = signJWT(user.getPayload());
                                out.write(jwt + '\n', err => {
                                    if (!err) resolve();
                                    count++;
                                });
                            })
                        })
                    ).then(() => {
                        out.end();
                        console.log('JWT exported: ' + count);
                        process.exit(0);
                    });
                }
            });
        });
    })
}