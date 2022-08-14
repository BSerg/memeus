import {Router, Request, Response, NextFunction} from 'express';
import multer from 'multer';
import passport from 'passport';
import toMs from 'parse-duration';

import {passportedHandler, checkIsAdmin} from '../../handlers';
import {client as redisClient, getCacheKey} from '../../../utils/cache';
import News, { newsStatus } from '../../../models/NewsModel';

export class AdminNewsRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getNews(req, res, next) {
        News.find({status: {$ne: newsStatus.DELETED}}).sort({createdAt: -1}).then(news => {
            res.json(news);
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    }

    createNews(req, res, next) {
        let news = new News({
            ...req.body
        });
        news.save().then(() => {
            res.json(news);
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
    }

    updateNews(req, res, next) {
        News.findById(req.params.newsId).then(news => {
            if (!news) return res.sendStatus(404);
            if (!req.body.text && !req.body.status) return res.sendStatus(400);
            if (req.body.text) {
                news.text = req.body.text;
            }
            if (req.body.status != undefined) {
                news.status = req.body.status;
            }
            news.save().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        }).catch(err => {
            res.sendStatus(500);
        });
    }

    deleteNews(req, res, next) {
        News.findById(req.params.newsId).then(news => {
            if (!news) return res.sendStatus(404);
            news.status = newsStatus.DELETED;
            news.save().then(() => {
                res.sendStatus(204);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    }

    init() {
        this.router.get('/', checkIsAdmin, this.getNews);
        this.router.post('/', checkIsAdmin, this.createNews);
        this.router.patch('/:newsId', checkIsAdmin, this.updateNews);
        this.router.delete('/:newsId', checkIsAdmin, this.deleteNews);
    }
}

export default new AdminNewsRouter().router;