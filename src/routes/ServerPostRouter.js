import {Router, Request, Response, NextFunction} from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {Helmet} from 'react-helmet';
import passport from 'passport';

import Post, {postStatus} from '../models/PostModel';
import PostAmp from 'components/Post/PostAmp';
import {client as redisClient, getCacheKey, feedName, composePost} from '../utils/cache';
import RenderContainer from 'components/RenderContainer';
import {PostContainer} from 'components/Post/PostContainer';
import {PostList} from 'components/PostList/PostList';
import {processPostData} from 'utils/process';
import {API_PAGE_SIZE} from 'utils/commonConstants';
import { PromiseProvider } from 'mongoose';
import { _getPosts } from './api/v1/AdminPostRouter';

import InfoPage from '../components/InfoPage/InfoPage';


function _getKeyData(url) {

    switch(url) {
        case '/best':
            return {key: getCacheKey(feedName.BEST), listType: 'best'};
        case '/fresh':
            return {key: getCacheKey(feedName.FRESH), listType: 'fresh'};
        case '/':
            return {key: getCacheKey(feedName.HOT), listType: 'hot'};
        default:
            return {key: null};
    }
}

function _getSlugs(key) {
    return new Promise((resolve, reject) => {
        redisClient.zrevrange(key, 0, API_PAGE_SIZE - 1, (err, slugs) => {
            if (err || !slugs) {
                return reject(null);
            }
            return resolve(slugs);
        })
    });
}

async function _composePosts(key, user) {
    try {
        if (user) {
            user.username = user.sub;
        }
        const slugs = await _getSlugs(key);
        let postsPromises = slugs.map(async (slug) => {
            return await composePost(slug, user);
        });
        
        let posts = await Promise.all(postsPromises);
        return posts;
    } catch(err) {
        console.log(err);
        return null
    }
}

export class PostRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getPost(req, res, next) {
        const slug = req.params.slug;
        let user = req.user;
        if (user && user.sub) {
            user.username = user.sub;
        }
        composePost(slug, user).then((post) => {
            let html = ReactDOMServer.renderToString(<RenderContainer>
                <PostContainer post={post}/>
            </RenderContainer>);
            const helmet = Helmet.renderStatic();
            res.render('index', {reactHtml: html, helmet,
                preloadedPost: JSON.stringify(post).replace(/</g, '\\u003c')});
        }).catch((err) => {
            next();
        });
    }

    getPostAmp(req, res, next) {
        const slug = req.params.slug;
        redisClient.get(getCacheKey('p', slug), (err, postJSON) => {
            if (err || postJSON === null) {
                return next();
            }
            redisClient.get(getCacheKey('p', slug, 'likes', 'count'), (err, count) => {
                const post = processPostData(JSON.parse(postJSON));
                const data = {
                    post, canonicalUrl: `${process.env.SITE_URL}/m/${post.slug}`,
                    mediaType: post.media[0].type, likes: count || 0
                };
                let html = ReactDOMServer.renderToString(<PostAmp data={data}/>);
                res.render('post_amp', {...data, reactHtml: html});
            });
        });
    }

    getPosts(req, res, next) {
        const {key, listType} = _getKeyData(req.url);
        if (!key) {
            return next();
        }
        _composePosts(key, req.user).then((posts) => {
            if (!posts || !posts.length) {
                return next();
            }
            let html = ReactDOMServer.renderToString(<RenderContainer>
                <PostList items={posts}/>
            </RenderContainer>);
            const helmet = Helmet.renderStatic();
            res.render('index', {reactHtml: html, helmet, 
                preloadedItemData: JSON.stringify({listType, items: posts, hasMore: posts.length === API_PAGE_SIZE}).replace(/</g, '\\u003c')});

        }).catch((err) => { 
            return next(); })
    }
    
    getAbout(req, res, next) {
        let html = ReactDOMServer.renderToString(<RenderContainer>
            <InfoPage />
        </RenderContainer>);
        res.render('index', {reactHtml: html});

    }

    getDefault(req, res, next) {
        next();
    }

    init() {
        this.router.get('/m/:slug', this.getPost);
        this.router.get('/m/:slug/amp', this.getPostAmp);
        this.router.get(['/best', '/fresh', '/'], this.getPosts);
        this.router.get('/about', this.getAbout);
    }
}

export default new PostRouter().router;