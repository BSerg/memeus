import {Router, Request, Response, NextFunction} from 'express';

import {checkIsAdmin} from '../../handlers';
import User from '../../../models/UserModel';
import Post, {postStatus} from '../../../models/PostModel';
import Comment, {commentStatus} from '../../../models/CommentModel';
import { _getPosts } from './AdminPostRouter';

const DEFAULT_PAGE_SIZE = 20;

let _processUser = userData => {
    let _data = userData;
    if (_data.avatar && _data.avatar.path) {
        _data.avatar.path = process.env.MEDIA_URL + _data.avatar.path;
    }
    else {
        _data.avatar = {path: ''};
    }
    return _data;
};

function _composeQueryParamData(query) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || DEFAULT_PAGE_SIZE;
    const sort = query.sort || 'nickname';
    let params = {};
    if (['true', 'false'].indexOf(query.isActive) !== -1) {
        params['isActive'] = query.isActive === 'true' ? true : false
    }
    if (query.q) {
        let rexp = new RegExp(query.q, 'i');
        params['$or'] = [{username: rexp}, {nickname:  rexp}];
    }

    return { page, pageSize, sort, params };
}


async function _getUsers(query) {
    try {
        const {page, pageSize, sort, params} = _composeQueryParamData(query);
        const count = await User.count(params).exec();
        const items = await User.find(params).sort(sort).skip(pageSize * (page - 1)).limit(pageSize).lean().exec();
        return {count, items: items.map((item) => { return _processUser(item) }) }
    } catch(err) {
        return null;
    }
    
}


export class AdminUserRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getUsers(req, res, next) {

        _getUsers(req.query).then((data) => {
            return data ? res.send(data) : res.sendStatus(404);
        }).catch((err) => { res.sendStatus(404); })
    }

    getUser(req, res, next) {
        User.findOne({username: req.params.username}).then((u) => {
            if (!u) {
                return res.sendStatus(404);
            }

            res.send(_processUser(u));
        }).catch((err) => { res.sendStatus(404); })
    }

    banUser(req, res, next) {
        User.findOne({username: req.params.username}).then((user) => {
            if (!user) {
                return res.sendStatus(404);
            }
            user.isActive = !req.body.ban;
            user.save();
            if (!user.isActive) {
                Post.find({author: user._id}).then((posts) => {
                    // console.log(posts);
                    if (posts) {
                        posts.forEach((p) => {
                            p.status = postStatus.BLOCKED;
                            p.save();   
                        })
                    }
                    
                }).catch((err) => { });
                Comment.find({user: user._id}).then((comments) => {
                    if (comments) {
                        comments.forEach((c) => {
                            c.status = commentStatus.BLOCKED;
                            c.save();
                        });
                    }
                }).catch((err) => { console.log('ERROR', err) });

            }
            res.sendStatus(200);
        }).catch((err) => {
            return res.sendStatus(404);
        })

        
    }

    init() {
        this.router.get('/', checkIsAdmin, this.getUsers);
        this.router.patch('/:username/ban', checkIsAdmin, this.banUser);
        this.router.get('/:username', checkIsAdmin, this.getUser);
    }
}


export default new AdminUserRouter().router;