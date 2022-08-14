import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';

import Queue from 'bull';

import {procRoute} from './index';

import Post, {Media, postStatus} from '../models/PostModel';
import User, {Avatar} from '../models/UserModel';
import Comment, {commentStatus, CommentMedia} from '../models/CommentModel';
import db from '../db';

let resultQueue = new Queue(process.env.RESULT_QUEUE, process.env.REDIS_URL);

resultQueue.on('completed', (job, result) => {
    console.log('RESULT COMPLETED', job.id, result);
});

resultQueue.on('error', (job, result) => {
    console.log('RESULT ERROR', job.id, result);
});

resultQueue.on('failed', err => {
    console.log(err);
});

resultQueue.process((job, done) => {

    switch (job.data.route) {
        case procRoute.POST:
            Post.findById(job.data.postId).populate('author').exec((err, post) => {
                if (err) done(err);
                if (post === null) {
                    done('Post not found');
                } else {
                    if (job.data.error) {
                        post.status = postStatus.ERROR;
                        post.save(err => {
                            if (err) done(err);
                            done(null, post);
                        });
                    } else {
                        let _media = {
                            preview: job.data.preview, 
                            default: job.data.default,
                            original: job.data.original,
                            type: job.data.type
                        };
                        post.media[job.data.mediaIndex] = Media(_media);
                        post.status = postStatus.PUBLISHED;
                        post.publishedAt = new Date();
                        post.save(err => {
                            if (err) done(err);
                            done(null, post);
                        });
                    }
                }
            });
            break;
        case procRoute.AVATAR:
            User.findById(job.data.userId).then(user => {
                if (user == null) {
                    done('User not found');
                } else {
                    if (job.data.error) {
                        done(job.data.error);
                    } else {
                        user.avatar = Avatar({...user.avatar, ...job.data.default});
                        user.save(err => {
                            if (err) done(err);
                            done(null, user)
                        })
                    }
                }

            }).catch(err => {
                done(err);
            });
        case procRoute.COMMENT:
            Comment.findById(job.data.commentId).then(comment => {
                if (comment == null) return done('Comment not found');
                if (job.data.error) {
                    comment.status = commentStatus.ERROR;
                    comment.save().then(() => {
                        done(null, comment);
                    }).catch(err => {
                        done(err);
                    });
                } else {
                    let _media = {
                        preview: job.data.preview, 
                        default: job.data.default,
                        original: job.data.original,
                        type: job.data.type
                    };
                    comment.media[job.data.mediaIndex] = CommentMedia(_media);
                    comment.status = commentStatus.PUBLISHED;
                    comment.publishedAt = new Date();
                    comment.save(err => {
                        if (err) done(err);
                        done(null, comment);
                    });
                }
            }).catch(err => {
                done(err);
            });
    }

    
});
