import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import uuid from 'uuid';
import Queue from 'bull';
import probe from 'probe-image-size';
import request from 'request';

import {keepFile} from '../utils';
import {errorCode} from '../utils/constants';

const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const imageMaxWidth = process.env.MAX_MEDIA_WIDTH || 600;
const imageMaxHeight = process.env.MAX_MEDIA_HEIGHT || 1200;


export let validateImage = imageFile => {
    if (imageMimeTypes.indexOf(imageFile.mimetype) == -1) {
        return [false, errorCode.CREATE_POST_MEDIA_BAD_MIMETYPE];
    }
    let info = probe.sync(imageFile.buffer);
    if (info.width > imageMaxWidth || info.height > imageMaxHeight) {
        return [false, errorCode.CREATE_POST_MEDIA_TOO_BIG];
    }
    if (imageFile.size > process.env.MAX_MEDIA_SIZE) {
        return [false, errorCode.CREATE_POST_MEDIA_TOO_HEAVY];
    }
    return [true, 0];
}

export let validateImageURL = url => {
    return new Promise((resolve, reject) => {
        request.head(url, (err, res, body) => {
            if (err) reject(errorCode.UNEXPECTED_ERROR);
            const headers = res.headers;
            if (imageMimeTypes.indexOf(headers['content-type']) === -1) {
                reject(errorCode.CREATE_POST_MEDIA_BAD_MIMETYPE);
            } else if (parseInt(headers['content-length']) > process.env.MAX_MEDIA_SIZE) {
                reject(errorCode.CREATE_POST_MEDIA_TOO_HEAVY);
            } else {
                probe(url).then(info => {
                    if (info.width > imageMaxWidth || info.height > imageMaxHeight) {
                        reject(errorCode.CREATE_POST_MEDIA_TOO_BIG);
                    } else {
                        resolve({...info, size: parseInt(headers['content-length'])});
                    }
                }).catch(err => {
                    reject(errorCode.UNEXPECTED_ERROR);
                });
            }
        });
    });
    
};

export let processMediaBase64 = base64String => {
    return new Promise((resolve, reject) => {
        try {
            let [format, b64Data] = base64String.substr(5).split(';base64,');
            let filePath = `${data._id}.${i}.${format.split('/')[1]}`;
        } catch (err) {
            reject(err);
        }
        let data = Buffer.from(base64Data, 'base64');
        keepFile(path.join(process.env.MEDIA_ROOT, filePath), data).then(() => {
            let img = new Image();
            img.onerror = (err) => {
                reject(err);
            };
            img.onload = () => {
                resolve({
                    path: filePath,
                    format: format.split('/')[1],
                    width: img.width,
                    height: img.height,
                    size: data.length
                })
            }
            img.src = base64String;
        }).catch(err => {
            reject(err);
        }); 
    });
};

export let processMedia = file => {
    return new Promise((resolve, reject) => {
        let [isValid, errorCode] = validateImage(file);
        if (isValid === false) {
            reject({errorCode});
        } else {
            let uid = uuid.v4();
            let fileName = path.join(uid.substr(0, 2), uid.substr(2, 2), uid + '.' + file.mimetype.split('/')[1]);
            let _path = path.join(process.env.EXCHANGE_ROOT, fileName);
            
            keepFile(_path, file.buffer).then(() => {
                let info = probe.sync(file.buffer);
                resolve({
                    path: fileName,
                    width: info.width,
                    height: info.height,
                    format: file.mimetype,
                    size: file.size
                })
            }).catch(err => {
                reject(err);
            });
        }
    });
};

export let processMediaURL = url => {
    return new Promise((resolve, reject) => {
        validateImageURL(url).then(info => {
            console.log(info)
            resolve({
                url: url,
                width: info.width,
                height: info.height,
                format: info.mimetype,
                size: info.size
            });
        }).catch(err => {
            reject({errorCode: err});
        });
    });
};

export const mediaQueue = new Queue(process.env.MEDIA_QUEUE, {
    redis: {
        host: process.env.REDIS_HOST, 
        port: process.env.REDIS_PORT, 
        db: process.env.REDIS_DB, 
        password: process.env.REDIS_PASSWORD
    },
    settings: {
        lockDuration: process.env.MEDIA_QUEUE_LOCK_DURATION || 30000
    }
});

export const procRoute = {
    POST: 'post',
    AVATAR: 'avatar',
    COMMENT: 'comment'
}

export let initMediaProcessing = (postId, mediaIndex, mediaData) => {
    let exchangePath = mediaData.url || process.env.EXCHANGE_URL + '/' + mediaData.path;
    mediaQueue.add({postId, mediaIndex, exchangePath, route: procRoute.POST}, {attempts: process.env.MEDIA_QUEUE_JOB_ATTEMPS});
}

export let initAvatarProcessing = (userId, mediaData) => {
    let exchangePath = process.env.EXCHANGE_URL + '/' + mediaData.path;
    mediaQueue.add({userId, exchangePath, route: procRoute.AVATAR}, {attempts: process.env.MEDIA_QUEUE_JOB_ATTEMPS});
}

export let initCommentMediaProcessing = (commentId, mediaIndex, mediaData) => {
    let exchangePath = process.env.EXCHANGE_URL + '/' + mediaData.path;
    mediaQueue.add({commentId, mediaIndex, exchangePath, route: procRoute.COMMENT}, {attempts: process.env.MEDIA_QUEUE_JOB_ATTEMPS});
}