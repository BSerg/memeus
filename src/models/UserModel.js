import mongoose, { mongo } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

import uuid from 'uuid';
import bcrypt from 'bcrypt';

import {getRandomString} from '../utils';
import MediaFile, {MediaFileSchema, BaseMediaFileSchema} from './MediaFileModel';
import {restrictedNicknames} from '../utils/constants';
import {cacheUser, cacheSubscription, updateUserReferalCountCache, } from '../utils/cache';
import {subscribeFriendsVK, subscribeFriendsTwitterWithRetry} from '../utils/social';
import { Wallet } from './paymentModels';

const SALT_WORK_FACTOR = 10;

mongoose.Promise = Promise;

export const AvatarSchema = new BaseMediaFileSchema({
    originURL: String
})

export const Avatar = mongoose.model('Avatar', AvatarSchema);

export const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, maxlength: 100, unique: true},
    password: {type: String, minlength: 6, unique: true, sparse: true},
    email: String,
    avatar: AvatarSchema,
    nickname: {type: String, minlength: 3, maxlength: 30, unique: true, sparse: true, lowercase: true, trim: true},
    tokenId: {type: String, index: true},
    isAdmin: Boolean,
    isActive: {type: Boolean, default: false, index: true},
    invitedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    accessToken: String
}, {collection: 'users'});

UserSchema.plugin(uniqueValidator);

UserSchema.path('nickname').validate(nickname => {
    return restrictedNicknames.indexOf(nickname) == -1;
});

UserSchema.methods.getPayload = function() {
    let payload = {
        sub: this.username,
        jti: this.tokenId,
        isActive: this.isActive,
    }
    if (this.isAdmin) payload.isAdmin = this.isAdmin;
    return payload;
}

UserSchema.methods.refreshTokenId = function() {
    this.tokenId = uuid.v4();
    return this.save();
}

UserSchema.statics.findOneOrCreate = function(conditions, userData, callback) {
    const User = this.model('User');
    User.findOne(conditions).then(user => {
        if (!user) {
            let newUser = new User(userData);
            newUser.save().then(() => {
                callback(null, newUser);
            }).catch(err => {
                console.error(err);
                callback(err, null);
            });
        } else {
            callback(null, user);
        }
    }).catch(err => {
        callback(err, null);
    });
};

UserSchema.statics.findOneOrCreateAsync = async function(conditions, userData) {
    const User = this.model('User');
    try {
        let user = await User.findOne(conditions), created = false;
        if (!user) {
            if (!userData.nickname) userData.nickname = uuid.v4().replace('-', '').substr(0, 7);
            userData.nickname = userData.nickname.toLowerCase();
            let nickname = userData.nickname;
            let count = 1
            while (await User.findOne({nickname: userData.nickname}) !== null) {
                userData.nickname = nickname + count;
                count++;
            }
            user = await new User(userData).save();
            created = true;
        }
        return [user, created];
    } catch(err) {
        throw err;
    }
}

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
};


UserSchema.pre('save', function(next) {
    this.__referalSaved = this.isModified('invitedBy');
    this.__isNew = this.isNew;

    if (!this.tokenId) {
        this.tokenId = uuid.v4();
    }
    if (this.isModified('password')) {
        let user = this;
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, function(err, hash) {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

UserSchema.post('save', async (user, next) => {
    await cacheUser(user, !user.isActive);
    user.__referalSaved && await updateUserReferalCountCache(user._id);
    if (user.__isNew) {
        let wallet = await Wallet.findOne({owner: user});
        if (!wallet) {
            wallet = new Wallet({owner: user});
            await wallet.save();
        }
        subscribeFriendsVK(user._id);
        subscribeFriendsTwitterWithRetry(user._id);
    };
    next();
});

export default mongoose.model('User', UserSchema);


export let SubscriptionSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    subscriber: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    isActive: {type: Boolean, default: true}
}, {
    timestamps: true,
    collection: 'subscriptions'
});

SubscriptionSchema.index({user: 1, subscriber: 1}, {unique: true});

SubscriptionSchema.pre('save', function(next) {
    this.__toCache = this.isNew || this.isModified('isActive');
    next();
});

SubscriptionSchema.post('save', async (sub, next) => {
    if (sub.__toCache) await cacheSubscription(sub._id);
    next();
});

SubscriptionSchema.statics.subscribe = async function(userId, subscriberId) {
    let sub = await Subscription.findOne({user: userId, subscriber: subscriberId});
    if (!sub) {
        sub = new Subscription({user: userId, subscriber: subscriberId});
        await sub.save();
        return sub;
    } else if (!sub.isActive) {
        sub.isActive = true;
        await sub.save();
        return sub;
    } else {
        return sub;
    }
};

export let Subscription = mongoose.model('Subscription', SubscriptionSchema);