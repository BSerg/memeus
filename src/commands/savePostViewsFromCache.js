import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import db from '../db';
import {getCacheKey, client, scan, zscan} from '../utils/cache';
import User from '../models/UserModel';
import Post, {postStatus} from '../models/PostModel';
import {PostView} from '../models/statModels';


let savePostViews = async key => {
    let slug = key.split(':')[key.startsWith(process.env.CACHE_PREFIX) ? 2 : 1].trim();

    return new Promise((resolve, reject) => {
        Post.findOne({slug, status: postStatus.PUBLISHED}).then(post => {
            if (!post) {
                resolve();
            } else {
                client.zrange(key, 0, -1, (err, usernames) => {
                    if (err) return resolve();
                    if (!usernames || !usernames.length) {
                        return resolve();
                    }
                    Promise.all(
                        usernames.map(_username => {
                            return new Promise((resolve, reject) => {
                                let username = _username.split(':')[0];
                                client.zscore(key, _username, (err, score) => {
                                    User.findOne({username}).then(user => {
                                        if (!user) return resolve();
                                        let view = new PostView({
                                            user: username,
                                            post: slug,
                                            date: score
                                        });
                                        view.save().then(() => {
                                            client.zrem(key, _username);
                                            resolve();
                                        });
                                    });
                                });
                            });
                        })
                    ).then(() => {
                        resolve();
                    });
                });
            }
        });
    });
    
};

scan(getCacheKey('p', '*', 'views')).then(async keys => {
    if (!keys || !keys.length) {
        console.log('There are no post views...');
        process.exit(0);
    };
    let count = 0;
    for (let i = 0; i < keys.length; i++) {
        await savePostViews(keys[i]);
        count++;
        console.log(`Completed ${count} of ${keys.length}`);
    }
    console.log('Views saved:', count);
    process.exit(0);
});