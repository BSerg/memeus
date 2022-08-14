import {Router, Request, Response, NextFunction} from 'express';
import multer from 'multer';
import passport from 'passport';
import toMs from 'parse-duration';

import {passportedHandler, checkIsAdmin} from '../../handlers';
import {client as redisClient, getCacheKey} from '../../../utils/cache';
import News, { newsStatus } from '../../../models/NewsModel';

export class NewsRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getNews(req, res, next) {
        let limit = parseInt(req.query.limit) || 1;
        redisClient.zrevrange(getCacheKey('news'), 0, limit, (err, news) => {
            Promise.all(news.map(_id => {
                return new Promise((resolve, reject) => {
                    redisClient.get(getCacheKey('n', _id), (err, res) => {
                        if (!err && res) {
                            let _news = JSON.parse(res);
                            resolve({
                                _id: _news._id,
                                text: _news.text,
                                createdAt: _news.createdAt
                            });
                        } else {
                            resolve(null);
                        }
                    });
                });
                
            })).then(news => {
                res.json(news.filter(n => n));
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    }

    init() {
        this.router.get('/', this.getNews);
    }
}

export default new NewsRouter().router;