import mongoose from 'mongoose';

import {getRandomString} from '../utils';

import {
    client as redisClient, 
    getCacheKey, 
    cachePost, 
    deletePostCache,
    updateFeedCache, 
    updateScoredFeedCache,
    updateUserPostList,
    cacheLike,
    feedName,
    composePost,
    cacheOldPostMark,
    updateUserPostListPublic,
    updateSubscriptionFeedCache,
    updateUserPostCountCache
} from '../utils/cache';
import { UserSchema } from './UserModel';
import MediaFile, {MediaFileSchema} from './MediaFileModel';
import {socketEmitter as io} from '../utils/socket';

mongoose.Promise = Promise;

export const MediaSchema = new mongoose.Schema({
    preview: MediaFileSchema,
    default: MediaFileSchema,
    original: MediaFileSchema,
    type: {
        type: String,
        enum: ['photo', 'animation', 'video'],
        default: 'photo'
    },
}, {
    timestamps: true,
});

export const postStatus = {
    NEW: 'new',
    PUBLISHED: 'published',
    DELETED: 'deleted',
    BLOCKED: 'blocked',
    ERROR: 'error'
};

export let Media = mongoose.model('Media', MediaSchema);


export const PostSchema = new mongoose.Schema({
    slug: {type: String, default: null, index: {unique: true, sparse: true}},
    caption: {type: String, maxlength: 255},
    media: [MediaSchema],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    status: {type: String, enum: Object.values(postStatus), default: postStatus.NEW},
    _prevStatus: {type: String, enum: Object.values(postStatus)},
    publishedAt: {type: Date, index: true},
    moderated: {type: Boolean, required: false}
}, {
    timestamps: true,
    collection: 'posts'
});

PostSchema.path('media').validate(media => {
    if (media.length > (process.env.MAX_MEDIA_PER_POST || 1)) {
        return false;
    }
    return true;
});

PostSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('status')) {
        this.__newOrStatusModified = true;
    }
    if (!this.slug) {
        const Post = this.model('Post');
        let slug = null, slugLength = 4;
        while (!slug || await Post.count({slug}) > 0) {
            slug = getRandomString(slugLength);            
            slugLength++;
        }
        this.slug = slug;
    }
    next();
});

let _cachePost = async post => {
    if (post.status == postStatus.DELETED || post.status == postStatus.BLOCKED) {
        try { await deletePostCache(post.slug); } catch(err) {console.log(err)};
    } else {
        try { await cachePost(post._id) } catch(err) {console.log(err)};
    }
    try { await updateFeedCache(post._id); } catch(err) {console.log(err)};
    try { await updateScoredFeedCache(post._id, feedName.BEST); } catch(err) {console.log(err)};
    try { await updateScoredFeedCache(post._id, feedName.HOT); } catch(err) {console.log(err)};
    try { await updateUserPostList(post._id); } catch(err) {console.log(err)};
    try { await updateUserPostListPublic(post._id); } catch(err) {console.log(err)};
    try { await updateSubscriptionFeedCache(post._id); } catch(err) {console.log(err)};
    if (post.__newOrStatusModified) {
        try {
            await updateUserPostCountCache(post._id)
        } catch(err) {
            console.log(err);
        }
    }
};

let _emitPostPublished = async post => {
    if (post.status != postStatus.PUBLISHED) return;
    try {
        let _post = await composePost(post.slug, post.author);
        io.to(post.author.username).emit('postPublished', _post);
    } catch(err) {
        console.log(err);
    }
};

PostSchema.post('save', (doc, next) => {
    _cachePost(doc).then(() => {
        _emitPostPublished(doc);
    }).catch(err => {
        console.log(err);
    });
    next();
});

PostSchema.post('findOneAndUpdate', (doc, next) => {
    _cachePost(doc).then(() => {
        _emitPostPublished(doc);
    }).catch(err => {
        console.log(err);
    });    
    next();
});

export default mongoose.model('Post', PostSchema);


const likeValue = {
    LIKE: 1,
    DISLIKE: -1,
    UNDEFINED: 0
}

export const LikeSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    value: {type: Number, enum: Object.values(likeValue), default: likeValue.UNDEFINED},
    _prevValue: {type: Number, default: likeValue.UNDEFINED}, 
}, {
    timestamps: true,
    collection: 'likes'
});

LikeSchema.path('value').validate(value => {
    return Object.values(likeValue).indexOf(value) != -1;
});

LikeSchema.index({post: 1, user: 1}, {unique: true});

LikeSchema.pre('findOneAndUpdate', function(next) {
    this.findOne().exec().then(doc => {
        if (doc != null) {
            this.update({_id: doc._id}, {_prevValue: doc.value}).then(() => {
                console.log('updated prev value');
                next();
            })
        } else {
            next();
        }
    });
});

LikeSchema.post('findOneAndUpdate', function(doc, next) {
    cacheLike(doc._id);
    next();
});

export let Like = mongoose.model('Like', LikeSchema);



export const OldPostMarkSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    isActive: {type: Boolean, default: true},
}, {
    timestamps: true,
    collection: 'oldPostMarks',
});

OldPostMarkSchema.index({post: 1, user: 1}, {unique: true});

OldPostMarkSchema.post('findOneAndUpdate', function(doc, next) {
    cacheOldPostMark(doc.post.slug, doc.user.username, !doc.isActive);
    next();
});

export const OldPostMark = mongoose.model('OldPostMark', OldPostMarkSchema);