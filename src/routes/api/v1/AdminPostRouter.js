import {Router, Request, Response, NextFunction} from 'express';
import {checkIsAdmin} from '../../handlers';
import User from '../../../models/UserModel';
import Post, {postStatus} from '../../../models/PostModel';
import Report, {repStatus} from '../../../models/ReportModel';


const DEFAULT_PAGE_SIZE = 20;

function _composeParams(query) {
    let params = {};
    if (query.reportedOnly === 'true') {
        params['moderated'] = query.moderated === 'true' ? true : {$ne: true};
    }
    if (query.q) {
        let rexp = new RegExp(query.q, 'i');
        params['$or'] = [{slug: rexp}, {caption:  rexp}];
    }
    if (query.status) {
        params['status'] = query.status !== 'all' ? query.status : {'$in' : [postStatus.PUBLISHED, 
            postStatus.DELETED, postStatus.BLOCKED]
        };
    }
    return params;
}

function _getPaginationParams(query) {
    const pageSize = parseInt(query.pageSize) || DEFAULT_PAGE_SIZE;
    const page = parseInt(query.page) || 1;
    const sort = query.sort || '-publishedAt';
    return {pageSize, page, sort};
}

async function _getReportData(reportType) {
    let params = { status: repStatus.ACTIVE };
    if (reportType !== 'all') {
        params['type'] = parseInt(reportType);
    }
    try {
        let reportData = await Report.aggregate(
            {$match: params}, 
            {$group:
                {_id: "$post", count: { $sum: 1 }}
            }
        );
        return reportData;
    }
    catch(err) {
        return []
    }
}


export async function _getPosts(query) {
    try {
        let params = _composeParams(query);
        if (query.author) {
            let user = await User.findOne({username: query.author});
            params['author'] = user._id;
        }
        let repData = null;
        if (query.reportedOnly === 'true') {
            repData = await _getReportData(query.reportType);
            params['_id'] = {$in: repData.map((d) => { return  `${d._id}`; })};
        }
        const {pageSize, page, sort} = _getPaginationParams(query);
        let count = await Post.count(params).exec();
        let items = await Post.find(params).sort(sort).skip(pageSize * (page - 1)).limit(pageSize).lean().exec();
        let processedItems = await Promise.all(items.map(async (i) => { let itm = await _processPostData(i, repData); return itm; }));
        return {count, items: processedItems};
    } catch(err) {
        return null;
    }
}


async function _processPostData(postData, repData) {
    let _postData = {...postData};

    let author = await User.findOne({_id: postData.author}).lean();
    try {
        author.avatar.path = process.env.MEDIA_URL + author.avatar.path;
    } catch (err) {}
    _postData.author = author;
    if (_postData.media) {
        _postData.media.forEach(media => {
            ['original', 'default', 'preview'].forEach(field => {
                let mediaItem = media[field];
                if (mediaItem) {
                    mediaItem.path = process.env.MEDIA_URL + mediaItem.path;
                    media[field] = mediaItem;
                }
            })
        });
    }

    if (repData && repData.length) {
        try {
            let report = repData.find((v) => { 
                return v._id.toString() === _postData._id.toString() 
            });
            _postData['reportCount'] = report.count;
        } catch(d) {  }
    }
    return _postData;
};




export class AdminPostRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    getPosts(req, res, next) {
        _getPosts(req.query).then((result) => {
            return result ? res.send(result) : res.sendStatus(404);
        }).catch((err) => { return null });
    }

    moderatePost(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then((post) => {
            post.moderated = true;
            post.save();
            res.sendStatus(200);
        }).catch((err) => {
            res.sendStatus(404);
        });
    }

    blockPost(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then((post) => {
            post.status = postStatus.BLOCKED;
            post.save();
            Report.update({post}, {$set: {status: repStatus.ACCEPTED}}, {many: true, upsert: false}).catch((e) => {});
            res.sendStatus(200);
        }).catch((err) => {
            res.sendStatus(404);
        });
    }

    unblockPost(req, res, next) {
        Post.findOne({slug: req.params.postSlug}).then((post) => {
            post.status = postStatus.PUBLISHED;
            post.save();
            res.sendStatus(200);
        }).catch((err) => {
            res.sendStatus(404);
        });
    }

    init() {
        this.router.get('/', checkIsAdmin, this.getPosts);
        this.router.patch('/:postSlug/moderate', checkIsAdmin, this.moderatePost);
        this.router.patch('/:postSlug/block', checkIsAdmin, this.blockPost);
        this.router.patch('/:postSlug/unblock', checkIsAdmin, this.unblockPost);
    }
}

export default new AdminPostRouter().router;