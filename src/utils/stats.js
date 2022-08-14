import Post, {OldPostMark, postStatus, Like} from '../models/PostModel';

export let getOldPostStats = (dateFrom, dateTo, minLikes = 10, limit = 100) => {
    return new Promise((resolve, reject) => {
        OldPostMark.aggregate([
            {$match: {isActive: true, createdAt: {$gte: dateFrom, $lt: dateTo}}},
            {$lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post"
            }},
            {$unwind: "$post"},
            {$match: {'post.status': postStatus.PUBLISHED}},
            {$group: {
                _id: '$post.slug',
                postId: {$first: '$post._id'},
                marks: {$sum: 1}
            }},
            {$lookup: {
                from: "likes",
                localField: "postId",
                foreignField: "post",
                as: "like"
            }},
            {$unwind: "$like"},            
            {$match: {'like.createdAt': {$gte: dateFrom, $lt: dateTo}}},            
            {$group: {
                _id: '$_id',
                marks: {$first: '$marks'},
                likes: {$sum: '$like.value'}
            }},
            {$sort: {likes: -1, marks: -1}},
            {$limit: limit}
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
    
};