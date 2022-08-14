import VK from 'vk-io';
import Twitter from 'twitter';
import {Facebook, FacebookApiException} from 'fb';
import User, { Subscription } from '../models/UserModel';

export const vk = new VK();
export const twitter = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
export const fb = new Facebook({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET
});

export let vkSearchFriends = async accessToken => {
    vk.setToken(accessToken);
    try {
        let response = await vk.api.friends.get('friends.get', {count: 10000});
        return response;
    } catch(err) {
        return null;
    }
};

export let subscribeFriendsVK = async userId => {
    let user = await User.findOne({_id: userId, username: new RegExp('^vk', 'i')});
    if (user && user.accessToken) {
        let data = await vkSearchFriends(user.accessToken);
        if (data && data.items) {
            for (let i = 0; i < data.items.length; i++) {
                let friendId = data.items[i];
                let friend = await User.findOne({username: 'vk' + friendId});
                if (friend) {
                    await Subscription.subscribe(user._id, friend._id);
                    await Subscription.subscribe(friend._id, user._id);
                }
            }   
        }
    }
};

export let twitterSearchFriends = async userId => {
    return await twitter.get('followers/ids', {
        user_id: userId
    });
};

export let subscribeFriendsTwitter = async userId => {
    let user = await User.findOne({_id: userId, username: new RegExp('^twitter', 'i')});
    if (user && user.username) {
        let socialId = user.username.slice(7);
        let data = await twitterSearchFriends(socialId);
        if (data && data.ids) {
            for (let i = 0; i < data.ids.length; i++) {
                let friendId = data.ids[i];
                let friend = await User.findOne({username: 'twitter' + friendId});
                if (friend) {
                    await Subscription.subscribe(user._id, friend._id);
                    // await Subscription.subscribe(friend._id, user._id);
                    // console.log('TWITTER FRIENDS', user.username, friend.username)
                }
            }   
            }
    }
};

export let subscribeFriendsTwitterWithRetry = (userId, attempts = 3) => {
    let _attempts = 0;
    subscribeFriendsTwitter(userId).catch(err => {
        if (err[0] && err[0].code == 88) {
            _attempts++;
            if (_attempts <= attempts) {
                setTimeout(() => {
                    subscribeFriendsTwitterWithRetry(userId, attempts);
                }, 15 * 60 * 1000);
            }
        }
    });
};

export let fbSearchFriends = async (userId, accessToken) => {
    fb.setAccessToken(accessToken);
    let res = await fb.api('me/friends');
    console.log(res);
};

export let subscribeFriendsFacebook = async (userId) => {
    // TODO: complete this stuff
    let user = await User.findOne({_id: userId, username: new RegExp('^fb', 'i')});
    console.log(user)
    if (user && user.username) {
        let socialId = user.username.slice(2);
        let data = await fbSearchFriends(socialId, user.accessToken);
        // if (data && data.ids) {
        //     for (let i = 0; i < data.ids.length; i++) {
        //         let friendId = data.ids[i];
        //         let friend = await User.findOne({username: 'twitter' + friendId});
        //         if (friend) {
        //             await Subscription.subscribe(user._id, friend._id);
        //             // await Subscription.subscribe(friend._id, user._id);
        //             // console.log('TWITTER FRIENDS', user.username, friend.username)
        //         }
        //     }   
        // }
    }
};