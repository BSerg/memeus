import {Router, Request, Response, NextFunction} from 'express';
import multer from 'multer';
import passport from 'passport';
import toMs from 'parse-duration';
import moment from 'moment';

import {passportedHandler} from '../../handlers';
import Post, {Like, postStatus, OldPostMark} from '../../../models/PostModel';
import Report from '../../../models/ReportModel';
import Comment, {commentStatus} from '../../../models/CommentModel';
import {initMediaProcessing, initCommentMediaProcessing, processMediaURL} from '../../../mediaProcessing';
import {validateImage, processMedia} from '../../../mediaProcessing';
import {errorCode} from '../../../utils/constants';
import {client as redisClient, getCacheKey, feedName, composePost, composeComment} from '../../../utils/cache';
import limiter from '../../limiter';
import reCaptcha from '../../../utils/reCaptcha';

const upload = multer();


export class PostRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getPost(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            let postSlug = req.params.postSlug;
            composePost(postSlug, user).then(post => {
                if (post === null) {
                    res.sendStatus(404);
                } else {
                    res.json(post);
                }
            }).catch(err => {
                if (err.errorCode == 1) {
                    res.sendStatus(404);
                } else {
                    res.sendStatus(500);
                }
            });
            
        })(req, res, next);
    }

    getPostList(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            new Promise((resolve, reject) => {

                switch (req.query.type) {
                    case feedName.BEST:
                    case feedName.HOT:
                        resolve(getCacheKey(req.query.type));
                        break;
                    case 'my':
                        if (!user) {
                            reject({status: 403, msg: 'Not authenticated'});
                        }
                        resolve(getCacheKey('u', user.username, 'p'));
                        break;
                    case 'user':
                        let keyLink = getCacheKey('u', 'link', req.query.nickname);
                        redisClient.get(keyLink, (err, username) => {
                            if (err) return reject({status: 500, msg: err});
                            if (!username) return reject({status: 404, msg: 'User not found'});
                            resolve(getCacheKey('u', username, 'p', 'public'));
                        });
                        break;
                    case 'subscriptions':
                        if (!user) return reject({status: 403, msg: 'Not authenticated'});
                        resolve(getCacheKey('u', user.username, 'p', 'subscriptions'));
                        break;
                    default:
                        resolve(getCacheKey(feedName.FRESH));
                }

            }).then(key => {
                let page = 0;
                
                if (req.query.page) {
                    page = Math.max(0, parseInt(req.query.page) - 1);
                }
    
                let pageSize = req.query.pageSize ? Math.min(parseInt(req.query.pageSize), 100) : 10;
                
                redisClient.zrevrange(key, page * pageSize, (page + 1) * pageSize - 1, (err, slugs) => {
                    if (err) res.sendStatus(500);
                    if (slugs === null) res.sendStatus(404);
        
                    let _p = [];
    
                    slugs.forEach(slug => {
                        _p.push(composePost(slug, user));
                    });
    
                    Promise.all(_p).then(posts => {
                        res.json(posts);
                    }).catch(err => {
                        console.log(err);
                        res.sendStatus(500);
                    });
                });
            }).catch(err => {
                res.sendStatus(err.status);
            });

        })(req, res, next);
    }

    createPost(req, res, next) {
        let user = req.user;

        let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        reCaptcha(req.body.captchaResponse, userIP, !!process.env.CAPTCHA_DISABLED).then(() => {

            if (req.body.caption && req.body.caption.lenght > 255) {
                res.status(400).json({errorCode: errorCode.CREATE_POST_CAPTION_TOO_LONG});
                return;
            }
    
            let mediaProcesses;
    
            if (req.files && req.files.length) {
                mediaProcesses = req.files.map(file => {
                    return processMedia(file);
                });
            } else if (req.body.url) {
                mediaProcesses = [processMediaURL(req.body.url)];
            } else {
                res.status(400).json({errorCode: errorCode.CREATE_POST_MEDIA_EMPTY});
                return;
            }
    
            Promise.all(mediaProcesses).then((media) => {
                let post = new Post({...req.body, author: user});
                post.save().then(_post => {
                    // media processing
                    media.forEach((mediaData, index) => {
                        initMediaProcessing(post._id, index, mediaData);
                    });
                    res.status(201).json({slug: post.slug});
                }).catch(err => {
                    console.error(err);
                    res.sendStatus(500);
                });
            }).catch(err => {
                if ([errorCode.CREATE_POST_MEDIA_BAD_MIMETYPE, errorCode.CREATE_POST_MEDIA_TOO_BIG, errorCode.CREATE_POST_MEDIA_TOO_HEAVY].indexOf(err.errorCode) != -1) {
                    res.status(400).json({errorCode: err.errorCode});
                } else {
                    console.log(err)
                    res.sendStatus(500);
                }
            });

        }).catch(err => {
            console.log(err);
            res.status(400).json({errorCode: errorCode.RECAPTCHA_INVALID});
        });
    }

    deletePost(req, res, next) {
        Post
            .findOne({slug: req.params.postSlug, status: {$in: [postStatus.NEW, postStatus.PUBLISHED]}})
            .then(post => {
                if (post === null) {
                    res.sendStatus(404);
                } else {
                    if (post.author.equals(req.user._id)) {
                        post._prevStatus = post.status;
                        post.status = postStatus.DELETED;
                        post.save().then(() => {
                            res.sendStatus(204);
                        }).catch(err => {
                            console.log(err);
                            res.sendStatus(500);
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            })
            .catch(err => {
                res.sendStatus(500);
            });
    }

    restorePost(req, res, next) {
        Post
            .findOne({slug: req.params.postSlug, status: postStatus.DELETED})
            .then(post => {
                if (post === null) {
                    res.sendStatus(404);
                } else {
                    if (post.author.equals(req.user._id)) {
                        post.status = post._prevStatus || postStatus.PUBLISHED;
                        post.save().then(() => {
                            res.sendStatus(200);
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            }).catch(err => {
                res.sendStatus(500);
            });
    }

    likePost(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then(post => {
            if (!post) res.sendStatus(404);
            else {
                Like.findOneAndUpdate(
                    {post: post._id, user: req.user._id}, 
                    {value: req.body.value},
                    {
                        new: true,
                        upsert: true,
                        runValidators: true,
                        setDefaultsOnInsert: {value: req.body.value}
                    }
                ).then(doc => {
                    res.sendStatus(200);
                }).catch( err => {
                    console.log(err)
                    res.sendStatus(400);
                });
            }
        }).catch(err => {
            console.log(err)
            res.sendStatus(400);
        });
    }

    markAsOld(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then(post => {
            if (!post) return res.sendStatus(404);

            OldPostMark
                .findOneAndUpdate(
                    {post: post._id, user: req.user._id},
                    {isActive: !!req.body.value},
                    {
                        new: true,
                        upsert: true,
                    }
                )
                .populate('post', 'slug')
                .populate('user', 'username')
                .then(doc => {
                    res.sendStatus(200);
                })
                .catch( err => {
                    console.log(err)
                    res.sendStatus(400);
                });
        }).catch((err) => {
            console.log(err)
            res.sendStatus(400);
        })
    }

    reportPost(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then(post => {
            if (!post) res.sendStatus(404);
            else {
                let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                reCaptcha(req.body.captchaResponse, userIP, process.env.NODE_ENV != 'production').then(() => {
                    Report.findOne({post, user: req.user}).then(report => {
                        if (report) {
                            console.log(moment().diff(moment(report.createdAt)))
                            if (moment().diff(moment(report.createdAt)) >= 10 * 60 * 1000) {
                                res.sendStatus(400);
                            } else {
                                report.type = req.body.type;
                                report.save().then(() => {
                                    res.sendStatus(200);
                                }).catch(err => {
                                    console.log(err);
                                    res.sendStatus(400);
                                });
                            }
                        } else {
                            let report = new Report({
                                post,
                                user: req.user,
                                type: req.body.type
                            });
                            report.save().then(() => {
                                res.sendStatus(200);
                            }).catch(err => {
                                console.log(err);
                                res.sendStatus(400);
                            });
                        }
                    });
                }).catch(err => {
                    console.log(err);
                    res.status(400).json({errorCode: errorCode.RECAPTCHA_INVALID});
                });
            }
        }).catch(err => {
            res.sendStatus(500);
        });
    }

    getComment(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            composeComment(req.params.commentId, user).then(comment => {
                if (!comment) return res.sendStatus(404);
                res.json(comment);
            }).catch(err => {
                res.sendStatus(500);
            });
        })(req, res, next);
    }

    getComments(req, res, next) {
        passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
            let key = getCacheKey('p', req.params.postSlug, 'comments');
            let page = 0, pageSize = 10, sort = -1, indexFrom = 0;
            
            let _zrange = (...params) => {
                return sort == -1 ? redisClient.zrevrange(...params) : redisClient.zrange(...params);
            };

            let _zrank = (...params) => {
                return sort == -1 ? redisClient.zrevrank(...params) : redisClient.zrank(...params);
            }

            let _onGetComments = (err, ids) => {
                if (err) res.sendStatus(500);
                if (ids == null) res.json([]);

                let _proc = [];

                ids.forEach(_id => {
                    _proc.push(composeComment(_id, user));
                });

                Promise.all(_proc).then(comments => {
                    res.json(comments);
                }).catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                });
            };

            if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1);
            if (req.query.pageSize) pageSize = Math.min(parseInt(req.query.pageSize), 100);
            if (req.query.sort && [-1, 1].indexOf(parseInt(req.query.sort))) sort = parseInt(req.query.sort);
            if (req.query.fromId) {
                _zrank(key, req.query.fromId, (err, index) => {
                    indexFrom = index || indexFrom;
                    _zrange(key, page * pageSize + indexFrom, (page + 1) * pageSize - 1 + indexFrom, _onGetComments);
                });
            } else {
                _zrange(key, page * pageSize, (page + 1) * pageSize - 1, _onGetComments);
            }
            
        })(req, res, next);
    }

    createComment(req, res, next) {
        Post.findOne({slug: req.params.postSlug, status: postStatus.PUBLISHED}).then(post => {

            if (!post) return res.sendStatus(404);

            if (!(req.files && req.files.length) && !req.body.text) {
                return res.status(400).json({errorCode: errorCode.CREATE_COMMENT_TEXT_OR_MEDIA_REQUIRED});
            }

            if (req.body.text && req.body.text.length > 280) {
                return res.status(400).json({errorCode: errorCode.CREATE_COMMENT_TEXT_TOO_LONG});
            }

            let data = {
                post,
                user: req.user,
                status: (req.files && req.files.length) ? commentStatus.NEW : commentStatus.PUBLISHED,
            };

            if (req.body.replyOn) data.replyOn = req.body.replyOn;

            if (req.body.text) data.text = req.body.text;
            if (req.files && req.files.length) {
                let mediaProcesses = req.files.map(file => {
                    return processMedia(file);
                });
                Promise.all(mediaProcesses).then((media) => {
                    let comment = new Comment(data);
                    comment.save().then(() => {
                        media.forEach((mediaData, index) => {
                            initCommentMediaProcessing(comment._id.toString(), index, mediaData);
                        });
                        res.status(201).json({_id: comment._id});
                    }).catch(err => {
                        if (err.errors && err.errors.replyOn) return res.status(400).json({errorCode: errorCode.CREATE_COMMENT_INVALID_REPLY_ON});
                        res.sendStatus(500);
                    });
                }).catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                });
            } else {
                let comment = new Comment(data);
                comment.save().then(() => {
                    composeComment(comment._id, req.user).then(_comment => {
                        res.status(201).json(_comment);
                    });
                }).catch(err => {
                    if (err.errors && err.errors.replyOn) return res.status(400).json({errorCode: errorCode.CREATE_COMMENT_INVALID_REPLY_ON});
                    res.sendStatus(500);
                });
            }

        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    }

    deleteComment(req, res, next) {
        Comment.findOne({_id: req.params.commentId, status: commentStatus.PUBLISHED}).populate('user', 'username').exec().then(comment => {
            if (!comment) return res.sendStatus(404);
            if (comment.user.username != req.user.username) return res.sendStatus(403);
            comment.status = commentStatus.DELETED;
            comment.save().then(() => {
                res.sendStatus(204);
            }).catch(err => {
                res.sendStatus(500);
            });
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    }

    init() {
        this.router.get('/', this.getPostList);
        this.router.post('/', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.CREATE_POST_LIMITER_TOTAL, 
                expire: toMs(process.env.CREATE_POST_LIMITER_EXPIRE)
            }), 
            upload.array('media', process.env.MAX_MEDIA_PER_POST || 1), 
            this.createPost
        ));
        this.router.get('/:postSlug', this.getPost);
        this.router.post('/:postSlug/like', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.LIKE_LIMITER_TOTAL, 
                expire: toMs(process.env.LIKE_LIMITER_EXPIRE)
            }), 
            this.likePost
        ));
        this.router.post('/:postSlug/old', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.LIKE_LIMITER_TOTAL, 
                expire: toMs(process.env.LIKE_LIMITER_EXPIRE)
            }), 
            this.markAsOld
        ));
        this.router.delete('/:postSlug', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.DELETE_POST_LIMITER_TOTAL, 
                expire: toMs(process.env.DELETE_POST_LIMITER_EXPIRE)
            }),
            this.deletePost
        ));
        
        this.router.patch('/:postSlug/restore', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.RESTORE_POST_LIMITER_TOTAL, 
                expire: toMs(process.env.RESTORE_POST_LIMITER_EXPIRE)
            }),
            this.restorePost
        ));

        this.router.post('/:postSlug/report', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.REPORT_POST_LIMITER_TOTAL, 
                expire: toMs(process.env.REPORT_POST_LIMITER_EXPIRE)
            }),
            this.reportPost
        ));

        this.router.get('/:postSlug/comments', this.getComments);
        this.router.get('/:postSlug/comments/:commentId', this.getComment);
        this.router.delete('/:postSlug/comments/:commentId', passportedHandler(this.deleteComment));
        this.router.post('/:postSlug/comments', passportedHandler(
            limiter({
                lookup: 'user._id', 
                total: process.env.CREATE_COMMENT_LIMITER_TOTAL || 30, 
                expire: toMs(process.env.CREATE_COMMENT_LIMITER_EXPIRE || '1m')
            }),
            upload.array('media', process.env.MAX_MEDIA_PER_COMMENT || 1), 
            this.createComment
        ));
    }
}

export default new PostRouter().router;
