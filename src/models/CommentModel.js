import mongoose, { Error } from 'mongoose';

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
    cacheComment,
    updatePostCommentsCache,
    updatePostCommentsCountCache,
    composeComment
} from '../utils/cache';
import { UserSchema } from './UserModel';
import MediaFile, {MediaFileSchema} from './MediaFileModel';
import {socketEmitter as io} from '../utils/socket';

export const CommentMediaSchema = new mongoose.Schema({
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

export const commentStatus = {
    NEW: 'new',
    PUBLISHED: 'published',
    DELETED: 'deleted',
    BLOCKED: 'blocked',
    ERROR: 'error'
};

export let CommentMedia = mongoose.model('CommentMedia', CommentMediaSchema);

export let CommentSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    text: {type: String, maxlength: 280},
    media: [CommentMediaSchema],
    status: {type: String, enum: Object.values(commentStatus), default: commentStatus.NEW},
    publishedAt: Date,
    replyOn: {type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}
}, {
    timestamps: true,
    collection: 'comments'
});

CommentSchema.pre('validate', function(next) {
    if (this.status == commentStatus.PUBLISHED &&    !this.text && !this.media.length) {
        next(new Error('Text or Media are required'));
    } else {
        next();
    }
});

let _emitNewComment = async comment => {
    if (comment.status != commentStatus.PUBLISHED) return;
    try {
        let _comment = await composeComment(comment._id);
        io.to(_comment.post.slug).emit('newComment', _comment);
    } catch(err) {
        console.log(err);
    }
};

CommentSchema.post('save', async (comment, next) => {
    await cacheComment(comment._id, comment.status != commentStatus.PUBLISHED);
    await updatePostCommentsCache(comment._id);
    await updatePostCommentsCountCache(comment._id);
    await _emitNewComment(comment);
    next();
});

export default mongoose.model('Comment', CommentSchema);