import dotenv from 'dotenv';
dotenv.config();
import redis from 'redis';

import Post, {postStatus, Like} from '../models/PostModel';
import User, { Subscription } from '../models/UserModel';
import Comment, {commentStatus} from '../models/CommentModel';
import News, {newsLang, newsStatus} from '../models/NewsModel';
import { setTimeout } from 'timers';

export let client = redis.createClient({
    host: process.env.CACHE_REDIS_HOST,
    port: process.env.CACHE_REDIS_PORT,
    db: process.env.CACHE_REDIS_DB,
    password: process.env.CACHE_REDIS_PASSWORD || undefined
});

client.on('ready', () => {
    console.log('CACHE REDIS CLIENT READY');
});

export let getCacheKey = (...chunks) => {
    const prefix = process.env.CACHE_PREFIX;
    if (prefix) chunks.unshift(prefix);
    return chunks.join(':');
};

export let _scan = (cursor = 0, pattern, callback = () => {}, onCompleted = () => {}) => {
    client.scan(cursor, 'MATCH', pattern, (err, result) => {
        let [nextCursor, results] = result;
        callback(results);
        if (nextCursor != 0) {
            _scan(nextCursor, pattern, callback, onCompleted);
        } else {
            onCompleted();
        }
    });
}

export let scan = (pattern) => {
    return new Promise((resolve, reject) => {
        let results = [];
        _scan(0, pattern, _results => {
            results = results.concat(_results);
        }, () => {
            resolve(results);
        });
    });
};

export let zscan = (setKey, cursor = 0, callback = () => {}) => {
    client.zscan(setKey, cursor, (err, result) => {
        let [nextCursor, results] = result;
        callback(result);
        if (nextCursor != 0) {
            zscan(setKey, nextCursor, callback);
        }
    });
};

let _cachePost = post => {
    return new Promise((resolve, reject) => {
        let postKey = getCacheKey('p', post.slug);
        client.set(postKey, JSON.stringify(post), err => {
            if (err) return reject(err);
            resolve(postKey);
        });
    });
};

let _cachePostAuthor = (slug, authorName) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', slug, 'author');
        client.set(key, authorName, err => {
            if (err) return reject(err);
            resolve(key);
        });
    });
};

export let deletePostCache = slug => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', slug);
        let authorKey = getCacheKey('p', slug, 'author');
        client.del(key, authorKey, err => {
            if (err) return reject(err);
            resolve();
        });
    });      
};

export let cachePost = async postId => {
    
    let post = await Post
        .findById(postId)
        .select(['slug', 'caption', 'author', 'media', 'status', 'publishedAt', 'createdAt'])
        .populate('author', 'username')
        .exec();

    if (post == null) throw 'Post not found';

    await _cachePostAuthor(post.slug, post.author.username);
    return await _cachePost(post);
};

// Like cache

let _updatePostLikeCount = like => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', like.post.slug, 'likes', 'count');
        if (like.value != 0 && like._prevValue !== like.value) {
            client.incrby(key, like.value - like._prevValue, (err, res) => {
                resolve();
            });
        } else if (like.value == 0) {
            client.decrby(key, like._prevValue, (err, res) => {
                resolve();
            });
        }  else {
            resolve();
        }  
    });
    
};

let _clearPostLikeCount = postSlug => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', postSlug, 'likes', 'count');
        client.set(key, 0, (err, res) => {
            resolve();
        });
    });
};

let _updatePostLikeList = like => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', like.post.slug, 'likes');
        client.zadd(key, like.value, like.user.username, (err, res) => {
            resolve();
        });
    });
}

let _clearPostLikeList = postSlug => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', postSlug, 'likes');
        client.del(key, (err, res) => {
            resolve();
        });
    });
};

export let cacheLike = likeId => {
    return new Promise((resolve, reject) => {
        Like
            .findById(likeId)
            .select(['post', 'user', 'value', '_prevValue', 'isActive'])
            .populate('post', 'slug')
            .populate('user', 'username')
            .exec((err, like) => {
                if (err) reject(err);
                if (like === null) reject('Like not found');
                _updatePostLikeCount(like);
                _updatePostLikeList(like);
            });
    });
};

export let cacheLikes = postId => {
    return new Promise((resolve, reject) => {
        Post.findById(postId).then(post => {
            let count = 0;
            if (!post) reject('Post not found');
            else {
                Promise.all([
                    _clearPostLikeCount(post.slug),
                    _clearPostLikeList(post.slug)
                ]).then(() => {
                    let proc = [];
                    let cursor = Like
                        .find({post: post._id})
                        .select(['post', 'user', 'value', '_prevValue', 'isActive'])
                        .populate('post', 'slug')
                        .populate('user', 'username')
                        .cursor();
            
                    cursor.on('data', like => {
                        proc.push(_updatePostLikeCount(like));
                        proc.push(_updatePostLikeList(like));
                        count++;
                    });

                    cursor.on('close', () => {
                        Promise.all(proc).then(() => {
                            resolve();                            
                        });
                    });
                }).catch(err => {
                    console.log(err)
                });
            }
        });
        
    });
}

export const feedName = {
    FRESH: 'fresh',
    HOT: 'hot',
    BEST: 'best'
};

// Feed cache

export let updateFeedCache = (postId, _delete = false) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey(feedName.FRESH);
        Post.findById(postId, (err, post) => {
            if (err) reject(err);
            if (post === null) reject('Post not found');
            if (post.status !== postStatus.PUBLISHED) {
                client.zrem(key, post.slug, err => {
                    if (err) reject(err);
                    resolve();
                });
            } else {
                client.zadd(key, new Date(post.publishedAt).getTime(), post.slug, err => {
                    if (err) reject(err);
                    resolve();
                })
            }
        });
    });
};

export let createFeedCache = (opts = {recentAmount: 0, forcePostCache: true}) => {
    // TODO: use mongoose stream
    return new Promise((resolve, reject) => {
        let postsQuery = Post.find({status: postStatus.PUBLISHED, publishedAt: {$exists: true}});
        
        if (opts.recentAmount > 0) {
            postsQuery = postsQuery.limit(opts.recentAmount);
        }
        
        let count = 0;

        let cursor = postsQuery.cursor();
        let total;

        cursor.eachAsync(async post => {
            if (!total) total = await postsQuery.count();
            if (opts.forcePostCache) {
                await cachePost(post._id);
            }

            await new Promise((_resolve, reject) => {
                let key = getCacheKey(feedName.FRESH);
                client.zadd(key, 'NX', new Date(post.publishedAt).getTime(), post.slug, (err, res) => {
                    if (err) {
                        console.log('Error adding post to feed cache', post.slug);
                    } else {
                        count++;
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(`Processed posts: ${count} of ${total}`);
                    }
                    _resolve();
                });
            });
        });

        cursor.on('close', () => {
            resolve(count);
        });
    });
}

export let updateScoredFeedCache = (postId, feedName) => {
    return new Promise((resolve, reject) => {
        Post.findById(postId).then(post => {
            if (post === null) reject('Post not found');
            if (post.status !== postStatus.PUBLISHED) {
                client.zrem(getCacheKey(feedName), post.slug);
            }
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
};

export let _createScoredFeedCache = (dateFrom, dateTo, feedName) => {
    let interval = dateTo.getTime() - dateFrom.getTime();
    return new Promise((resolve, reject) => {
        Like.aggregate([
            {$match: {createdAt: {$gte: dateFrom, $lt: dateTo}}},
            {$lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post"
            }},
            {$unwind: "$post"},
            {$match: {"post.status": postStatus.PUBLISHED}},
            {$project: {post: 1, value: 1, dif: {$subtract: [dateTo, "$createdAt"]}}},
            {$project: {post: 1, value: 1, mul: {$pow: [{$divide: ["$dif", interval]}, 2]}}},
            {$group: {
                _id: '$post.slug',
                slug: {$first: '$post.slug'},
                likes: {$sum: "$value"},
                mul: {$first: '$mul'}
            }},
            {$project: {_id: 1, slug: 1, likes: 1, mul: 1, weight: {$multiply: ["$likes", "$mul"]}}},
            {$match: {weight: {$gt: 0}}},
            {$sort: {weight: -1}}
        ], (err, result) => {
            if (err) reject(err);
            if (result.length) {
                let data = [];
                result.forEach(r => {
                    data.push(r.weight);
                    data.push(r.slug);
                });
                let key = getCacheKey(feedName);
                client.del(key, err => {
                    if (err) reject(err);
                    client.zadd(key, ...data, (err, count) => {
                        if (err) reject(err);
                        resolve(count);
                    });
                });
            } else {
                reject('There is nothing to cache');
            }
            
        });  
    });
}

export let createScoredFeedCache = (dateFrom, dateTo, feedName) => {
    let interval = dateTo.getTime() - dateFrom.getTime();
    return new Promise((resolve, reject) => {
        Like.aggregate([
            {$match: {createdAt: {$gte: dateFrom, $lt: dateTo}}},
            {$lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post"
            }},
            {$unwind: "$post"},
            {$match: {"post.status": postStatus.PUBLISHED, "post.publishedAt": {$gte: dateFrom, $lte: dateTo}}},
            {$group: {
                _id: '$post.slug',
                slug: {$first: '$post.slug'},
                likes: {$sum: "$value"},
            }},
            {$project: {_id: 0}},
            {$match: {likes: {$gt: 0}}},
            {$sort: {likes: -1}}
        ], (err, result) => {
            if (err) reject(err);
            if (result.length) {
                let data = [];
                result.forEach(r => {
                    data.push(r.likes);
                    data.push(r.slug);
                });
                let key = getCacheKey(feedName);
                client.del(key, err => {
                    if (err) reject(err);
                    client.zadd(key, ...data, (err, count) => {
                        if (err) reject(err);
                        resolve(count);
                    });
                });
            } else {
                reject('There is nothing to cache');
            }
            
        });  
    });
}

// User cache

export let cacheUser = (user, _delete = false) => {
    return new Promise((resolve, reject) => {
        let keyLink = getCacheKey('u', 'link', user.nickname);
        let key = getCacheKey('u', user.username);

        if (_delete) {
            client.del(keyLink, key, (err, res) => {
                if (err) return reject(err);
                resolve(true);
            });
        } else {
            client.set(keyLink, user.username);
            client.set(key, JSON.stringify({
                _id: user._id,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar
            }), (err, res) => {
                if (err) return reject(err);
                resolve(true)
            });
        }
    });
};

export let createUserPostListPublic = userId => {
    return new Promise((resolve, reject) => {
        let cursor = Post
            .find({status: postStatus.PUBLISHED})
            .select(['slug', 'publishedAt', 'createdAt'])
            .populate('author', 'username')
            .where('author').equals(userId)
            .cursor()
        
        cursor.eachAsync(post => {
            return new Promise((resolve, reject) => {
                let data = [];
                cachePost(post._id).then(() => {
                    let score = new Date(post.publishedAt || post.createdAt).getTime(); 
                    client.zadd(getCacheKey('u', post.author.username, 'p', 'public'), score, post.slug, (err, r) => {
                        if (err) console.log(err);
                        resolve();
                    });
                }).catch(err => {
                    console.log(err);
                    resolve();
                });
            })
        }).then(() => {
            resolve();
        });
    });
};

export let updateUserPostListPublic = postId => {
    return new Promise((resolve, reject) => {
        Post
            .findById(postId)
            .populate('author', 'username')
            .exec()
            .then(post => {
                if (post === null) reject('Post not found');
                let key = getCacheKey('u', post.author.username, 'p', 'public');
                if (post.status === postStatus.PUBLISHED) {
                    let score = new Date(post.publishedAt || post.createdAt).getTime();
                    client.zadd(key, score, post.slug, (err, r) => {
                        if (err) reject(err);
                        resolve();
                    });
                } else {
                    client.zrem(key, post.slug, (err, r) => {
                        if (err) reject(err);
                        resolve();
                    });
                }
            }).catch(err => {
                reject(err);
            });
    });
};

export let createUserPostList = userId => {
    return new Promise((resolve, reject) => {
        let cursor = Post
            .find({status: {$in: [postStatus.NEW, postStatus.PUBLISHED]}})
            .select(['slug', 'publishedAt', 'createdAt'])
            .populate('author', 'username')
            .where('author').equals(userId)
            .cursor()
        
        cursor.on('data', post => {
            let data = [];
            cachePost(post._id);
            let score = new Date(post.publishedAt || post.createdAt).getTime(); 
            client.zadd(getCacheKey('u', post.author.username, 'p'), score, post.slug, (err, r) => {
                if (err) console.log(err);
            });
        });

        cursor.on('close', () => {
            resolve();
        });
    });
};

export let updateUserPostList = postId => {
    return new Promise((resolve, reject) => {
        Post
            .findById(postId)
            .populate('author', 'username')
            .exec()
            .then(post => {
                if (post === null) reject('Post not found');
                let key = getCacheKey('u', post.author.username, 'p');
                if (post.status === postStatus.PUBLISHED || post.status === postStatus.NEW) {
                    let score = new Date(post.publishedAt || post.createdAt).getTime();
                    client.zadd(key, score, post.slug, (err, r) => {
                        if (err) reject(err);
                        resolve();
                    });
                } else {
                    client.zrem(key, post.slug, (err, r) => {
                        if (err) reject(err);
                        resolve();
                    });
                }
            }).catch(err => {
                reject(err);
            });
    });
};

export let updateUserReferalCountCache = userId => {
    return new Promise((resolve, reject) => {
        User.findById(userId).populate('invitedBy', 'username').then(user => {
            if (!user) return reject('User not found');
            if (user.invitedBy) {
                let key = getCacheKey('u', user.invitedBy.username, 'referals', 'count');
                if (user.isActive) {
                    client.incr(key, (err, res) => {
                        if (err) return reject(err);
                        resolve(res);
                    });
                } else {
                    client.decr(key, (err, res) => {
                        if (err) return reject(err);
                        resolve(res);
                    });
                }
            } else {
                resolve();
            }
        });
    });
};

export let createUserReferalCountCache = userId => {
    return new Promise((resolve, reject) => {
        User.aggregate([
            {$match: {_id: userId, isActive: true}},
            {$lookup: {
                from: "users",
                localField: "_id",
                foreignField: "invitedBy",
                as: "referal"
            }},
            {$unwind: "$referal"},
            {$group: {
                _id: "$username",
                referals: {$sum: 1}
            }},
            {$project: {_id: 0, username: "$_id", referals: 1}}
        ]).then(result => {
            if (result.length && result[0].referals) {
                let key = getCacheKey('u', result[0].username, 'referals', 'count');
                client.set(key, result[0].referals, err => {
                    if (err) console.log(err);
                    resolve();
                });
            } else {
                resolve();
            }
        }).catch(err => {
            reject(err);
        });
    });
};

export let updateUserPostCountCache = postId => {
    return new Promise((resolve, reject) => {
        Post.findById(postId).populate('author', 'username').then(post => {
            if (!post) return reject('Post not found');
            let key = getCacheKey('u', post.author.username, 'p', 'count');
            if (post.status == postStatus.PUBLISHED) {
                client.incr(key, (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            } else {
                client.decr(key, (err, res) => {
                    if (err) return reject(err);
                    resolve(res);
                });
            }
        }).catch(err => {
            reject(err);
        });
    });
};

export let createUserPostCountCache = userId => {
    return new Promise((resolve, reject) => {
        User.findOne({_id: userId, isActive: true}).then(user => {
            if (!user) return reject('User not found');
            Post.find({author: user, status: postStatus.PUBLISHED}).count().then(count => {
                if (count) {
                    let key = getCacheKey('u', user.username, 'p', 'count');
                    client.set(key, count, err => {
                        if (err) return reject(err);
                        resolve(key);
                    });
                } else {
                    resolve();
                }
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err);
        });
    });
};

export let cacheVisitTick = (username, sessionId) => {
    let visitKey = getCacheKey('u', username, 'visit', sessionId);
    let visitKeyLock = getCacheKey('u', username, 'visit', sessionId, 'lock');
    let key = getCacheKey('u', username, 'visits');
    client.exists(visitKeyLock, (err, exists) => {
        if (exists === 0) {
            client.zadd(key, 'NX', new Date().getTime(), visitKey);
            client.incrby(visitKey, 30);
            client.set(visitKeyLock, 'locked');
            client.expire(visitKeyLock, 30);
        }
    });
};

export let cachePostView = (slug, username) => {
    let viewKey = getCacheKey('p', slug, 'views');
    let viewKeyLock = getCacheKey('p', slug, 'u', username, 'view', 'lock');
    client.exists(viewKeyLock, (err, exists) => {
        if (exists === 0) {
            let timestamp = new Date().getTime();
            let value = username + ':' + timestamp;
            client.zadd(viewKey, timestamp, value);
            client.set(viewKeyLock, 'locked');
            client.expire(viewKeyLock, 30);            
        }
    });
};

export let cacheOldPostMark = (slug, username, _delete = false) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', slug, 'old_marks');
        if (_delete) {
            client.srem(key, username, (err, res) => {
                if (err) return reject(err);
                resolve();
            });
        } else {
            client.sadd(key, username, (err, res) => {
                if (err) return reject(err);
                resolve();
            });
        }
    });
};

// Comments cache

export let _cacheComment = (comment, _delete = false) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('c', comment._id.toString());
        if (_delete) {
            client.del(key, err => {
                if (err) return reject(err);
                return resolve(key);
            });
        } else {
            client.set(key, JSON.stringify(comment), err => {
                if (err) return reject(err);
                resolve(key);
            });
        }
    });
};

export let cacheComment = async (commentId, _delete = false) => {
    let comment = await Comment
        .findById(commentId)
        .select(['post', 'user', 'text', 'media', 'publishedAt', 'createdAt', 'status', 'replyOn'])
        .populate('post', 'slug')
        .populate('user', 'username')
        .exec();
    if (!comment) throw 'Comment not found';
    return await _cacheComment(comment, _delete);
};

export let _createPostCommentsCache = (post, forceCacheComment = true) => {
    return new Promise((resolve, reject) => {
        let _proc = [];
        let count = 0;
        let key = getCacheKey('p', post.slug, 'comments');
        let cursor = Comment.find({post, status: commentStatus.PUBLISHED}, {}, {timeout: true}).cursor();
        cursor.on('data', comment => {
            _proc.push(
                new Promise((resolve, reject) => {
                    let score = new Date(comment.publishedAt || comment.createdAt).getTime();
                    client.zadd(key, score, comment._id.toString(), (err, res) => {
                        if (err) return reject(err);
                        if (forceCacheComment) {
                            cacheComment(comment._id);
                        }
                        count++;
                        resolve();
                    });
                })
            )
        });
        cursor.on('close', () => {
            Promise.all(_proc).then(() => {
                resolve(count);
            }).catch(err => {
                reject(err);
            });
        }); 
    });
};

export let createPostCommentsCache = async (postId, forceCacheComment = true) => {
    let post = await Post.findById(postId);
    if (!post) throw 'Post not found';
    return await _createPostCommentsCache(post, forceCacheComment);
};

export let _updatePostCommentsCache = comment => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', comment.post.slug, 'comments')
        if (comment.status == commentStatus.PUBLISHED) {
            let score = new Date(comment.publishedAt || comment.createdAt).getTime();
            client.zadd(key, score, comment._id.toString(), (err, res) => {
                if (err) return reject(err);
                resolve();
            });
        } else {
            client.zrem(key, comment._id.toString(), (err, res) => {
                if (err) return reject(err);
                resolve();
            });
        }
    });
};

export let updatePostCommentsCache = async commentId => {
    let comment = await Comment.findById(commentId).populate('post', 'slug').exec();
    if (!comment) throw 'Comment not found';
    return await _updatePostCommentsCache(comment);
};

export let createPostCommentsCountCache = postId => {
    return new Promise((resolve, reject) => {
        Post.findById(postId).then(post => {
            if (!post) return reject('Post not found');
            Comment.find({post: post, status: commentStatus.PUBLISHED}).count().then(count => {
                let key = getCacheKey('p', post.slug, 'comments', 'count');
                client.set(key, count, err => {
                    if (err) return reject(err);
                    resolve(count);
                })
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err);
        });
    });
};

export let _updatePostCommentsCountCache = comment => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('p', comment.post.slug, 'comments', 'count');
        if (comment.status == commentStatus.DELETED || comment.status == commentStatus.BLOCKED) {
            client.decr(key, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        } else if (comment.status == commentStatus.PUBLISHED) {
            client.incr(key, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        }  else {
            resolve();
        }
    });
};

export let updatePostCommentsCountCache = async commentId => {
    let comment = await Comment.findById(commentId).populate('post', 'slug').exec();
    if (!comment) throw 'Comment not found';
    return await _updatePostCommentsCountCache(comment);
};

// Subscription cache

let _cacheSubscriber = (username, subscriber, timestamp, _delete = false) => {
    return new Promise((resolve, reject) => {
        let keySubscribers = getCacheKey('u', username, 'subscribers');
        let keySubscribersCount = getCacheKey('u', username, 'subscribers', 'count');
        if (_delete) {
            client.zrem(keySubscribers, subscriber, (err, res) => {
                if (err) return reject(err);
                if (res == 1) {
                    client.decr(keySubscribersCount, (err, res) => {
                        if (err) return reject(err);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        } else {
            client.zadd(keySubscribers, timestamp, subscriber, (err, res) => {
                if (err) return reject(err);
                if (res == 1) {
                    client.incr(keySubscribersCount, (err, res) => {
                        if (err) return reject(err);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }
    });
};

let _cacheSubscription = (username, subscriber, timestamp, _delete = false) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', subscriber, 'subscriptions');
        let keyCount = getCacheKey('u', subscriber, 'subscriptions', 'count');
        if (_delete) {
            client.zrem(key, username, (err, res) => {
                if (err) return reject(err);
                client.decr(keyCount, (err, res) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        } else {
            client.zadd(key, timestamp, username, (err, res) => {
                if (err) return reject(err);
                client.incr(keyCount, (err, res) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
    });
};

export let cacheSubscription = async subscriptionId => {
    let sub = await Subscription.findById(subscriptionId).populate('user', 'username').populate('subscriber', 'username').exec();
    if (!sub) throw 'Subscription not found';

    await _cacheSubscriber(
        sub.user.username, 
        sub.subscriber.username, 
        new Date(sub.createdAt).getTime(), 
        !sub.isActive
    );

    await _cacheSubscription(
        sub.user.username, 
        sub.subscriber.username, 
        new Date(sub.createdAt).getTime(), 
        !sub.isActive
    );
}

export let updateSubscriptionFeedCache = async postId => {
    let post = await Post.findById(postId);
    let subscribers = await Subscription.aggregate([
        {$match: {isActive: true, user: post.author}},
        {$lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriber"
        }},
        {$unwind: "$subscriber"},
        {$match: {'subscriber.isActive': true}},
        {$project: {username: "$subscriber.username"}}
    ]);
    for (let i = 0; i < subscribers.length; i++) {
        let subscriber = subscribers[i];
        let key = getCacheKey('u', subscriber.username, 'p', 'subscriptions')
        await new Promise((resolve, reject) => {
            if (post.status == postStatus.PUBLISHED) {
                client.zadd(key, new Date(post.publishedAt || post.createdAt).getTime(), post.slug, (err, res) => {
                    if (err) return reject(err);
                    resolve(key);
                });
            } else {
                client.zrem(key, post.slug, (err, res) => {
                    if (err) return reject(err);
                    resolve(key);
                });
            }
        });
    };
};

export let createSubscriptionFeedCache = async userId => {
    let user = await User.findOne({_id: userId, isActive: true});
    let posts = await Subscription.aggregate([
        {$match: {isActive: true, subscriber: userId}},
        {$lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "_user"
        }},
        {$unwind: "$_user"},
        {$match: {'_user.isActive': true}},
        {$lookup: {
            from: "posts",
            localField: "_user._id",
            foreignField: "author",
            as: "post"
        }},
        {$unwind: "$post"},
        {$match: {'post.status': postStatus.PUBLISHED}},
        {$sort: {'post.publishedAt': -1}},
        {$project: {
            _id: '$post._id',
            slug: '$post.slug',
            publishedAt: '$post.publishedAt'
        }}
    ]);

    let key = getCacheKey('u', user.username, 'p', 'subscriptions');

    for (let i = 0; i < posts.length; i++) {
        await new Promise((resolve, reject) => {
            client.zadd(key, new Date(posts[i].publishedAt).getTime(), posts[i].slug, (err, res) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

};

// New cache

export let cacheNews = newsId => {
    return new Promise((resolve, reject) => {
        News.findById(newsId).then(news => {
            if (!news) return reject('News not found');
            let key = getCacheKey('n', news._id.toString());
            if (news.status == newsStatus.PUBLISHED) {
                client.set(key, JSON.stringify(news), err => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                client.del(key, err => {
                    if (err) return reject(err);
                    resolve();
                });
            }
        }).catch(err => {
            reject(err);
        });
    });
};

export let updateNewsFeed = newsId => {
    return new Promise((resolve, reject) => {
        News.findById(newsId).then(news => {
            if (!news) return reject('News not found');
            let key = getCacheKey('news');
            if (news.status == newsStatus.PUBLISHED) {
                client.zadd(key, new Date(news.createdAt).getTime(), news._id.toString(), (err, res) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                client.zrem(key, news._id.toString(), (err, res) => {
                    if (err) return reject(err);
                    resolve();
                });
            }
        }).catch(err => {
            reject(err);
        });
    });
};

export let createNewsFeedCache = () => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('news');
        News.find({status: newsStatus.PUBLISHED}).then(news => {
            let data = [];
            news.forEach(n => {
                data.push(new Date(n.createdAt).getTime());
                data.push(n._id.toString());
            });
            if (!data.length) return resolve(0);
            client.zadd(key, ...data, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    });
};

// Compose user

let _processUser = userData => {
    let _data = userData;
    if (_data.avatar && _data.avatar.path) {
        _data.avatar.path = process.env.MEDIA_URL + _data.avatar.path;
    }
    return _data;
};

let _getUserByNickname = nickname => {
    return new Promise((resolve, reject) => {
        let keyLink = getCacheKey('u', 'link', nickname);
        client.get(keyLink, (err, username) => {
            if (err) return reject(err);
            if (!username) return reject('Nickname link not found');
            _getUser(username, ['username', 'nickname', 'avatar']).then(user => {
                resolve(user);
            });
        });
    });
}

let _getSubscribers = username => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'subscribers', 'count');
        client.get(key, (err, count) => {
            if (err) reject(err);
            resolve(parseInt(count) || 0);
        });    
    });
};

let _getSubscriptions = username => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'subscriptions', 'count');
        client.get(key, (err, count) => {
            if (err) reject(err);
            resolve(parseInt(count) || 0);
        });    
    });
};

let _isSubscribed = (username, subscriber) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'subscribers');
        client.zrank(key, subscriber, (err, res) => {
            if (err) return reject(err);
            resolve(res !== null);
        });
    });
};

let _getPostCount = (username) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'p', 'count');
        client.get(key, (err, count) => {
            if (err) return reject(err);
            resolve(count || 0);
        });
    });
};

let _getReferalCount = (username) => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('u', username, 'referals', 'count');
        client.get(key, (err, count) => {
            if (err) return reject(err);
            resolve(count || 0);
        });
    });
};

export let composeUser = async (nickname, _user) => {
    let user = await _getUserByNickname(nickname);
    if (!user) throw 'User not found';
    user.posts = await _getPostCount(user.username);
    user.subscribers = await _getSubscribers(user.username);
    user.subscriptions = await _getSubscriptions(user.username);
    if (_user && _user.username) {
        user.isSelf = user.username == _user.username;
        user.isSubscribed = await _isSubscribed(user.username, _user.username);
        if (user.isSelf) {
            user.referals = await _getReferalCount(user.username);
        }; 
    }
    delete user.username;
    return _processUser(user);
};

export let composeUserByUsername = async (username, _user) => {
    let user = await _getUser(username, ['username', 'nickname', 'avatar']);
    if (!user) throw 'User not found';
    user.posts = await _getPostCount(user.username);
    user.subscribers = await _getSubscribers(user.username);
    user.subscriptions = await _getSubscriptions(user.username);
    if (_user && _user.username) {
        user.isSelf = user.username == _user.username;
        user.isSubscribed = await _isSubscribed(user.username, _user.username);
        if (user.isSelf) {
            user.referals = await _getReferalCount(user.username);
        }; 
    }
    delete user.username;
    return _processUser(user);
};

// Compose post

let _processPostData = (postData, user) => {
    let _postData = {...postData};
    let author = _postData.author;
    delete _postData.author;
    if (user && (author._id == user._id || author.username === user.username )) {
        _postData.isOwner = true;
    }
    _postData.media.forEach(media => {
        ['original', 'default', 'preview'].forEach(field => {
            let mediaItem = media[field];
            if (mediaItem) {
                mediaItem.path = process.env.MEDIA_URL + mediaItem.path;
                media[field] = mediaItem;
            }
        })
    });
    
    return _postData;
}

let _getUser = (username, fields = ['nickname', 'avatar']) => {
    return new Promise((resolve, reject) => {
        client.get(getCacheKey('u', username), (err, user) => {
            if (err) return reject(err);
            if (user) {
                let _user = JSON.parse(user);
                let data = {};
                fields.forEach(field => {
                    if (_user[field]) data[field] = _user[field];
                })
                resolve(data);
            } else {
                resolve(null);
            }
        });
    });
};

let _getPost = slug => {
    return new Promise((resolve, reject) => {
        client.get(getCacheKey('p', slug), (err, postJSON) => {
            if (err) return reject(err);
            resolve(JSON.parse(postJSON));
        });
    });
};

let _getAuthor = post => {
    return new Promise((resolve, reject) => {
        client.get(getCacheKey('p', post.slug, 'author'), (err, authorUsername) => {
            if (err) reject(err);
            if (authorUsername) {
                _getUser(authorUsername, ['nickname', 'avatar', 'username']).then(author => {
                    resolve(author);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(null);
            }
        });
    });
};

let _getLikes = slug => {
    return new Promise((resolve, reject) => {
        client.get(getCacheKey('p', slug, 'likes', 'count'), (err, count) => {
            if (err) return reject(err);
            if (count) return resolve(parseInt(count));
            resolve(0);
        });
    });
};

let _likedByUser = (slug, username) => {
    return new Promise((resolve, reject) => {
        client.zscore(getCacheKey('p', slug, 'likes'), username, (err, score) => {
            if (err) return reject(err);
            if (score) return resolve(parseInt(score));
            resolve(0);
        });
    });
};

let _markedAsOld = (slug, username) => {
    return new Promise((resolve, reject) => {
        if (!username) return resolve(null);
        client.sismember(getCacheKey('p', slug, 'old_marks'), username, (err, isMember) => {
            if (err) return reject(err);
            resolve(isMember == 1);
        });
    });
};

let _getCommentsCount = slug => {
    return new Promise((resolve, reject) => {
        client.get(getCacheKey('p', slug, 'comments', 'count'), (err, count) => {
            if (err) return reject(err);
            resolve(count || 0);
        });
    });
}

export let composePost = async (slug, user, _public = true) => {
    let post = await _getPost(slug);

    if (post == null || post.status == postStatus.DELETED || post.status == postStatus.BLOCKED) {
        return null;
    }

    post.likes = await _getLikes(post.slug);
    post.comments = await _getCommentsCount(post.slug);
    
    let author = await _getAuthor(post);
    if (author) {
        post.isOwner = user && user.username == author.username;
        if (author.avatar) {
            author.avatar.path = process.env.MEDIA_URL + author.avatar.path;
        }
        post.author = {nickname: author.nickname, avatar: author.avatar};
    }

    if (user && user.username) {
        post.like = await _likedByUser(post.slug, user.username);
        post.old = await _markedAsOld(post.slug, user.username);
    }

    post.media.forEach(media => {
        ['original', 'default', 'preview'].forEach(field => {
            let mediaItem = media[field];
            if (mediaItem) {
                mediaItem.path = process.env.MEDIA_URL + mediaItem.path;
                media[field] = mediaItem;
            }
        })
    });

    return post;
};

// Compose comment

let _getComment = _id => {
    return new Promise((resolve, reject) => {
        let key = getCacheKey('c', _id);
        client.get(key, (err, commentJson) => {
            if (err) return reject(err);
            resolve(JSON.parse(commentJson));
        });
    });
};

export let composeComment = async (_id, user) => {
    let comment = await _getComment(_id);
    if (!comment) return null;
    comment.user = await _getUser(comment.user.username, ['nickname', 'avatar', 'username']);
    if (comment.user) {
        comment.isOwner = !!user && comment.user.username == user.username;
        delete comment.user.username;
        if (comment.user.avatar) comment.user.avatar.path = process.env.MEDIA_URL + comment.user.avatar.path;
    }
    comment.media.forEach(media => {
        ['original', 'default', 'preview'].forEach(field => {
            let mediaItem = media[field];
            if (mediaItem) {
                mediaItem.path = process.env.MEDIA_URL + mediaItem.path;
                media[field] = mediaItem;
            }
        });
    });
    return comment;
}