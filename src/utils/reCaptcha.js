import request from 'request';

const checkURL = ' https://www.google.com/recaptcha/api/siteverify';

export default (captchaResponse, remoteIP, fake = false) => {
    return new Promise((resolve, reject) => {
        request.post(checkURL, {form: {
            secret: process.env.RECAPTCHA_SECRET,
            response: captchaResponse,
            remoteip: remoteIP
        }}, (err, res, body) => {
            if (err) reject(err);
            let _body = JSON.parse(body);
            if (_body.success || fake) {
                resolve();
            } else {
                reject();
            }
        });
    });
};