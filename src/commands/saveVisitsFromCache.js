import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import {getCacheKey, client} from '../utils/cache';
import User from '../models/UserModel';
import {Visit} from '../models/statModels';


let processUserVisits = username => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'visits');
        client.zrange(key, 0, -1, (err, visits) => {
            if (visits) {
                Promise.all(
                    visits.map(visit => {
                        return new Promise((resolve, reject) => {
                            client.zscore(key, visit, (err, timestamp) => {
                                client.exists(visit + ':lock', (err, locked) => {
                                    if (locked == 0) {
                                        client.get(visit, (err, duration) => {
                                            let _visit = new Visit({
                                                user: username,
                                                date: parseInt(timestamp),
                                                duration: parseInt(duration)
                                            });
                                            _visit.save().then(() => {
                                                client.del(visit);
                                                client.zrem(key, visit);
                                                console.log('Visit saved', _visit._id);
                                                resolve();
                                            }).catch(err => {
                                                console.log(err);
                                                resolve();
                                            });    
                                        });
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                        });
                    })
                ).then(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
    
};

let task = async () => {
    let users = await User.find({isActive: true});
    if (!users) process.exit(0);
    for (let i = 0; i < users.length; i++) {
        await processUserVisits(users[i].username);
    }
    process.exit(0);
}

task();