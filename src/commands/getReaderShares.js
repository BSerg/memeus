import dotenv from 'dotenv';
dotenv.config();

import polyfill from 'babel-polyfill';
import parseDuration from 'parse-duration';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

import {getReferalPayments, getUsersPaymentShares, getAuthorsPaymentShares} from '../utils/payments';
import {round} from '../utils';
import User from '../models/UserModel';
import Wallet, {Transaction, transactionType} from '../models/WalletModel';

import db from '../db';

if (!process.argv[2]) {
    console.log('Interval param is required');
    process.exit(1);
}

let tz = process.env.TZ || 'Europe/Moscow';

let dateFrom = moment(process.argv[2]).tz(tz).startOf('day'), dateTo, amount = 100000;
if (process.argv[3]) {
    dateTo = moment(process.argv[3]).tz(tz).startOf('day');
} else {
    dateTo = dateFrom.clone();
    dateTo.add(1, 'days');
}

if (process.argv[4]) {
    amount = parseInt(process.argv[4]);
}

dateFrom = dateFrom.toDate();
dateTo = dateTo.toDate();

getUsersPaymentShares(amount, dateFrom, dateTo).then(res => {
    console.log(res);
    console.log(res.shares.filter(item => {return item.username == 'vk1119090'}));
})

// User.aggregate([
//     {$match: {isActive: true, username: "vk1119090"}},
//     {$lookup: {
//         from: "visits",
//         localField: "username",
//         foreignField: "u",
//         as: "visit"
//     }},
//     {$unwind: "$visit"},
//     {$match: {
//         "visit.d": {$gte: dateFrom.valueOf(), $lt: dateTo.valueOf()},
//     }},
//     {$group: {
//         _id: "$username",
//         userId: {$first: "$_id"},
//         visits: {$sum: 1},
//     }},
//     {$lookup: {
//         from: "postViews",
//         localField: "_id",
//         foreignField: "u",
//         as: "postView"
//     }},
//     {$unwind: "$postView"},
//     {$match: {
//         "postView.d": {$gte: dateFrom.valueOf(), $lt: dateTo.valueOf()}
//     }},
//     {$group: {
//         _id: "$_id",
//         userId: {$first: "$userId"},
//         visits: {$first: "$visits"},
//         views: {$sum: 1},
//     }},
//     {$lookup: {
//         from: "likes",
//         localField: "userId",
//         foreignField: "user",
//         as: "like"
//     }},
//     {$unwind: {path: "$like", preserveNullAndEmptyArrays: true}},
//     {$match: {
//         "like.createdAt": {$gte: dateFrom, $lt: dateTo}
//     }},
//     {$group: {
//         _id: "$_id",
//         userId: {$first: "$userId"},
//         visits: {$first: "$visits"},
//         views: {$first: "$views"},
//         likes: {$sum: 1}
//     }},
//     {$match: {
//         visits: {$gte: 1},
//         views: {$gte: 10},
//         likes: {$gte: 2}
//     }},
//     {$lookup: {
//         from: "reports",
//         localField: "userId",
//         foreignField: "user",
//         as: "report"
//     }},
//     {$unwind: {path: "$report", preserveNullAndEmptyArrays: true}},
//     {$group: {
//         _id: "$_id",
//         visits: {$first: "$visits"},
//         views: {$first: "$views"},
//         likes: {$first: "$likes"},
//         reports: {
//             $sum: {
//                 $cond: [
//                     {
//                         $or: [
//                             {$ifNull: ["$report", false]}, 
//                             {$ne: ["$report.status", "accepted"]},
//                             {$lt: ["$report.createdAt", dateFrom]},
//                             {$gte: ["$report.createdAt", dateTo]},
//                         ]
//                     }, 0, 1
//                 ]
//             }
//         }
//     }},
//     {$project: {
//         _id: 1,
//         visits: 1,
//         views: 1,
//         likes: 1,
//         reports: 1,
//         points: {$cond: [{$gt: ["$reports", 0]}, 3, 1]}
//     }},
//     {$sort: {points: -1, likes: -1, views: -1, visits: -1}},
//     {$group: {
//         _id: null,
//         usernames: {$push: "$_id"},
//         points: {$push: "$points"},
//         total: {$sum: "$points"}
//     }},
//     {$project: {
//         usernames: 1,
//         points: 1,
//         shares: {$map: {input: "$points", as: "p", in: {$divide: ["$$p", "$total"]}}}
//     }}
    
// ], (err, result) => {
//     console.log(result)
// });