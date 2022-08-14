import fs from 'fs';
import path from 'path';
import Jwt from 'jsonwebtoken'
import request from 'request';
import uuid from 'uuid';
import mkdirp from 'mkdirp';
import probe from 'probe-image-size';
import {Router, Request, Response, NextFunction} from 'express';


export function getRandomString(length = 5) {
    let rString = uuid.v4().replace('-', '');
    return rString.substr(0, length);
}

export let round = (value, decimals = 2) => {
    let mul = Math.pow(10, decimals);
    return Math.round(value * mul) / mul;
};

export let floor = (value, decimals = 2) => {
    let mul = Math.pow(10, decimals);
    return Math.floor(value * mul) / mul;
};

export let ceil = (value, decimals = 2) => {
    let mul = Math.pow(10, decimals);
    return Math.ceil(value * mul) / mul;
};

export let keepFile = (_path, data) => {
    return new Promise((resolve, reject) => {
        mkdirp(path.dirname(_path), err => {
            if (err) reject(err);
            fs.writeFile(_path, data, err => {
                if (err) reject(err);
                resolve();
            });
        });
        
    });
}

export function signJWT(payload) {
    if (process.env.JWT_ALGORITHM.startsWith('RS')) {
        let privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH);
        return Jwt.sign(payload, privateKey, {algorithm: process.env.JWT_ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || '1y'});
    } else {
        return Jwt.sign(payload, process.env.SECRET, {algorithm: process.env.JWT_ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || '1y'});
    }
}

export function signJWTAsync(payload) {
    return new Promise((resolve, reject) => {

        if (process.env.JWT_ALGORITHM.startsWith('RS')) {
            let privateKey = fs.readFile(process.env.PRIVATE_KEY_PATH, (err, privateKey) => {
                if (err) reject(err);
                resolve(Jwt.sign(payload, privateKey, {algorithm: process.env.JWT_ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || '1y'}));
            });
        } else {
            resolve(Jwt.sign(payload, process.env.SECRET, {algorithm: process.env.JWT_ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || '1y'}));
        }
    });
    
}

export function verifyJWT(token, ignoreExpiration = false) {
    let secret = process.env.JWT_ALGORITHM.startsWith('RS') ? 
        fs.readFileSync(process.env.PUBLIC_KEY_PATH): process.env.SECRET;
    return Jwt.verify(token, secret, {ignoreExpiration: ignoreExpiration});
}

export function verifyJWTAsync(token, ignoreExpiration = false) {
    return new Promise((resolve, reject) => {
        if (process.env.JWT_ALGORITHM.startsWith('HS')) {
            try {
                resolve(Jwt.verify(token, process.env.SECRET, {ignoreExpiration: ignoreExpiration}));
            } catch(err) {
                reject(err);
            }
        } else {
            fs.readFile(process.env.PUBLIC_KEY_PATH, (err, privateKey) => {
                try {
                    resolve(Jwt.verify(token, privateKey, {ignoreExpiration: ignoreExpiration}));
                } catch(err) {
                    reject(err);
                }
            });
        }
    });
}

export function filterObjectFields(obj, allowedFields = [], excludedFields = []) {
    let filterFunction = field => allowedFields.length ? allowedFields.indexOf(field) != -1 : excludedFields.indexOf(field) == -1
    return Object.keys(obj)
        .filter(filterFunction)
        .reduce((filteredUser, field) => {
            filteredUser[field] = obj[field]; 
            return filteredUser;
        }, {})
}

export function downloadImage(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject('URL is required');
        }
        try {
            request.head(url, (err, res, body) => {
                if (err) {
                    reject(err);
                }
                let contentType = res.headers['content-type'];
                let contentLength = res.headers['content-length'];
                let contentTypeList = [
                    'image/jpg',
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                ]
                if (contentTypeList.indexOf(contentType) != -1) {
                    let ext = contentType.split('/')[1];
                    let filename = `${uuid.v4()}.${ext}`;
                    let filepath = path.join(filename.substr(0, 2), filename.substr(2, 2), filename);
                    let mediaPath = process.env.EXCHANGE_ROOT + '/' + filepath;
        
                    mkdirp(path.dirname(mediaPath), err => {
                        if (err) {
                            reject(err);
                        } else {
                            let image = {path: filepath, type: contentType.split('/')[1], size: contentLength};
                            let writeStream = fs.createWriteStream(mediaPath);
                            request(url).pipe(writeStream);
                            writeStream.on('finish', () => {
                                let _stream = fs.createReadStream(mediaPath);
                                let info = probe(_stream).then(info => {
                                    resolve({
                                        path: filepath,
                                        width: info.width,
                                        height: info.height,
                                        format: info.type,
                                        size: parseInt(contentLength)
                                    });
                                    _stream.destroy();
                                });
                            });
                            writeStream.on('error', err => {
                                reject(err);
                            });
                        }
                    });
                    
                } else {
                    reject("Content-Type is not allowed");
                }
            });
        } catch(err) {
            reject(err);
        }
    });
}

export function setJWTCookie(res, token, extraOptions = null) {
    let cookieOptions = {
        maxAge: 1000 * 60 * 60 * 24 * 365, 
        domain: process.env.BASE_DOMAIN,
        path: '/'
    }
    if (process.env.NODE_ENV == 'production') {
        cookieOptions.secure = true;
    }
    if (extraOptions) Object.assign(cookieOptions, extraOptions);
    res.cookie('jwt', token, cookieOptions);
}

export function setJWTLocalStorage(token) {
    if (token === null) {
        localStorage.removeItem('jwt');
    } else {
        localStorage.setItem('jwt', token);
    }
}