import mongoose from 'mongoose';

import {cacheNews, updateNewsFeed} from '../utils/cache';

export const newsLang = {
    RU: 'ru',
    EN: 'en'
};

export const newsStatus = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    DELETED: 'deleted'
};

export let NewsSchema = new mongoose.Schema({
    text: {
        ru: String,
        en: String 
    },
    status: {type: String, enum: Object.values(newsStatus), default: newsStatus.DRAFT}
}, {
    timestamps: true,
    collection: 'news'
});

NewsSchema.post('save', async (news, next) => {
    await cacheNews(news._id);
    await updateNewsFeed(news._id);
    next();
});

export default mongoose.model('News', NewsSchema);