import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import connectRedis from 'connect-redis';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportFacebook from 'passport-facebook';
import passportVkontakte from 'passport-vkontakte';
import passportTwitter from 'passport-twitter';
import passportGoogle from 'passport-google-oauth';
import passportJWT from 'passport-jwt';
import logger from 'morgan';
import translit from 'cyrillic-to-latin';
import locale from 'locale';
import request from 'request';

import {baseRoutes} from './routes/baseRoutes';
import AuthRouter from './routes/AuthRouter';
import OAuthRouter from './routes/OAuthRouter';
import ServerPostRouter from './routes/ServerPostRouter';
import PostRouterV1 from './routes/api/v1/PostRouter';
import UserRouterV1 from './routes/api/v1/UserRouter';
import InfoRouter from './routes/api/v1/InfoRouter';
import NewsRouter from './routes/api/v1/NewsRouter';
import AdminUserRouterV1 from './routes/api/v1/AdminUserRouter';
import AdminPostRouterV1 from './routes/api/v1/AdminPostRouter';
import AdminStatRouter from './routes/api/v1/AdminStatRouter';
import AdminNewsRouter from './routes/api/v1/AdminNewsRouter';
import AdminPaymentsRouter from './routes/api/v1/AdminPaymentsRouter';

import {setJWTCookie} from './utils';

import User from './models/UserModel';
import {downloadImage} from './utils';
import {initAvatarProcessing} from './mediaProcessing';

import db from './db';

import fs from 'fs';
import { passReferal } from './routes/handlers';

const SUPPORTED_LOCALES = ['ru', 'en'];
const DEFAUL_LOCALE = 'ru';

let manifest = null;

try {
    manifest = JSON.parse(fs.readFileSync(process.env.MANIFEST_PATH, 'utf8'));
} catch(err) {}

class AppClass {

    express;

    corsOptions = {
        origin: '*'
    };
    
    constructor() {
        this.express = express();
        this.express.set('view engine', 'ejs');
        this.express.set('views', path.join(process.env.DIR_PATH, 'views'));
        let RedisStore = connectRedis(session);
        let sessionOptions = {
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365,
                secure: false
            },
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: true,
        };
        if (process.env.NODE_ENV == 'production' || process.env.USE_LOCAL_REDIS_SESSION) {
            this.express.set('trust proxy', 1);
            // sessionOptions.cookie.secure = true;
            sessionOptions.store = new RedisStore({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                db: process.env.REDIS_DB,
                pass: process.env.REDIS_PASSWORD,
            })
        }
        if (process.env.NODE_ENV !== 'production') {
            const cors = require('cors');
            this.express.use(cors(this.corsOptions));
        }
        this.express.use(session(sessionOptions));
        this.express.use((req, res, next) => {
            let tries = 3
            function lookupSession(error = null) {
                if (error) return next(error);
                tries--;
                if (req.session !== undefined) return next();
                if (tries < 0) return next(new Error('Session retried more than 3 times'));
                session(sessionOptions)(req, res, lookupSession);
            }
            lookupSession();
        });
        this.express.use(logger('tiny'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(locale(SUPPORTED_LOCALES, DEFAUL_LOCALE));
        this.passportInit();
        this.routes();
    }

    passportInit() {
        
        async function getOrCreateUser(username, userData, done, referal) {
            try {
                let [user, created] = await User.findOneOrCreateAsync({username: username}, userData);
                if (created && referal) {
                    User.findOne({nickname: referal}).then(ref => {
                        if (ref) {
                            user.invitedBy = ref._id;
                            user.save().then(() => {
                                done(null, user);
                            }).catch(err => {
                                done(err, null);
                            });
                        } else {
                            done(null, user);
                        }
                    }).catch(err => {
                        console.log(err);
                        done(err);
                    })
                } else {
                    done(null, user);
                }

                if (created && user.avatar.originURL) {
                    try {
                        let avatarData = await downloadImage(user.avatar.originURL);
                        initAvatarProcessing(user._id, avatarData);
                    } catch(err) {
                        console.log(err);
                        throw err;
                    }
                }  

            } catch(err) {
                console.log(err);
                done(err);
            }
        }
    
        passport.serializeUser(function(user, done) {
            done(null, user._id);
        });
    
        passport.deserializeUser(function(userId, done) {
            User.findById(userId).then(user => {
                if (user) {
                    done(null, user.getPayload())
                }
                else {
                    done(null, null);
                }
                
            }).catch(err => {
                done(err, null);
            });
        });
    
        passport.use(new passportLocal.Strategy((username, password, done) => {
            User.findOne({username: username}).then(user => {
                if (!user) return done(null, false, 'User not found');
                user.comparePassword(password).then(isMatch => {
                    return isMatch ? done(null, user) : done(null, false, 'Password is invalid');
                }).catch(err => {
                    return done(err);
                });
            }).catch(err => {
                return done(err);
            })
        }));

        passport.use(new passportJWT.Strategy({
            jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ALGORITHM.startsWith('RS') ? fs.readFileSync(process.env.PUBLIC_KEY_PATH): process.env.SECRET,
            algorithms: [process.env.JWT_ALGORITHM]
        }, function(jwtPayload, done) {
            User.findOne({username: jwtPayload.sub, tokenId: jwtPayload.jti}).then(user => {
                if (!user) {
                    done(null, false);
                } else if (!user.isActive) {
                    done({status: 401, msg: "User is not active"}, false);
                } else {
                    done(null, user);
                }
            }).catch(err => {
                done(err, false);
            });
        }));
    
        passport.use(new passportFacebook.Strategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL,
            profileFields: ['id', 'displayName', 'first_name', 'last_name', 'picture.type(large)', 'email'],
            passReqToCallback: true
        }, (req, accessToken, refreshToken, profile, done) => {

            let url = `https://graph.facebook.com/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&grant_type=fb_exchange_token&fb_exchange_token=${accessToken}`;
            request.get(url, (err, res) => {
                if (!err && res.body.access_token) {
                    accessToken = res.body.access_token;
                }
                let username = 'fb' + profile.id, nickname;
                if (profile.name.familyName && profile.name.givenName) {
                    nickname = translit(`${profile.name.givenName}.${profile.name.familyName}`);
                } else if (profile._json.email) {
                    nickname = profile._json.email.split('@')[0];
                } else {
                    nickname = username;
                }
                let avatar = {originURL: profile.photos.length ? profile.photos[0].value : null};
                let userData = {
                    username, 
                    nickname, 
                    avatar, 
                    email: profile._json.email, 
                    isActive:true,
                    accessToken                    
                };
                getOrCreateUser(username, userData, done, req.session.referal);
            });
        }));
    
        passport.use('vk', new passportVkontakte.Strategy({
            clientID: process.env.VK_APP_ID,
            clientSecret: process.env.VK_APP_SECRET,
            callbackURL: process.env.VK_CALLBACK_URL,
            scope: ['email', 'friends', 'offline'],
            profileFields: ['email', 'photo_100'],
            apiVersion: '5.65',
            passReqToCallback: true
        }, (req, accessToken, refreshToken, params, profile, done) => {
            let username = 'vk' + profile.id, nickname;
            if (profile._json.screen_name) {
                nickname = profile._json.screen_name;
            } else if (profile._json.first_name && profile._json.last_name) {
                nickname = translit(`${profile._json.first_name}.${profile._json.last_name}`);
            } else if (profile._json.email) {
                nickname = profile._json.email.split('@')[0];
            } else {
                nickname = username;
            }
            let avatar = {originURL: profile._json.photo_100};
            let userData = {
                username, 
                nickname, 
                avatar, 
                email: profile._json.email, 
                accessToken: accessToken,
                isActive:true
            };
            getOrCreateUser(username, userData, done, req.session.referal);
        }));
    
        passport.use(new passportTwitter.Strategy({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: process.env.TWITTER_CALLBACK_URL,
            includeEmail: true,
            passReqToCallback: true
        }, (req, accessToken, refreshToken, profile, done) => {
            let username = 'twitter' + profile.id, nickname;    
            if (profile._json.screen_name) {
                nickname = profile._json.screen_name;
            } else if (profile._json.name) {
                nickname = translit(profile._json.name.replace(' ', '.'));
            } else if (profile._json.email) {
                nickname = profile._json.email.split('@')[0];
            } else {
                nickname = username;
            }
            let avatarURL = profile._json.profile_image_url.replace('_normal', '');
            let avatar = {originURL: avatarURL};
            let userData = {username, nickname, avatar, email: profile._json.email, isActive:true};
            getOrCreateUser(username, userData, done, req.session.referal);
        }));
    
        passport.use('google', new passportGoogle.OAuth2Strategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true
        }, (req, accessToken, refreshToken, profile, done) => {
            // console.log(profile);
            let username = 'google' + profile.id, nickname;
            if (profile._json.nickname) {
                nickname = profile._json.nickname;
            } else if (profile.name.givenName && profile.name.familyName) {
                nickname = translit(`${profile.name.givenName}.${profile.name.familyName}`);
            } else if (profile.emails.length) {
                nickname = profile.emails[0].value;
            } else {
                nickname = username;
            }
            let avatar = {originURL: profile._json.image ? profile._json.image.url : null};
            let userData = {username, nickname, avatar, email: profile.emails[0].value || null, isActive:true};
            getOrCreateUser(username, userData, done, req.session.referal);
        }));

        this.express.use(passport.initialize());
        this.express.use(passport.session());
    }

    routes() {
        
        if (process.env.NODE_ENV != 'production') {
            this.express.use('/static', express.static(path.join(process.env.STATIC_PATH)));
        }
        
        this.express.use('/api/v1/posts', PostRouterV1);  
        this.express.use('/api/v1/users', UserRouterV1);  
        this.express.use('/api/v1/info', InfoRouter),
        this.express.use('/api/v1/news', NewsRouter),
        this.express.use('/api/v1/admin/users', AdminUserRouterV1);  
        this.express.use('/api/v1/admin/posts', AdminPostRouterV1);
        this.express.use('/api/v1/admin/stats', AdminStatRouter);
        this.express.use('/api/v1/admin/news', AdminNewsRouter);
        this.express.use('/api/v1/admin/payments', AdminPaymentsRouter);
        this.express.use('/api', (req, res, next) => {
            return res.sendStatus(404);
        });
        this.express.use(passReferal);
        this.express.use((req, res, next) => {
            if (process.env.NODE_ENV != 'production') {
                res.locals.isDevelopment = true;
            }
            res.locals.defaultLocale = req.locale;
            res.locals.manifest = manifest;

            // if (!req.isAuthenticated()) {
            //     setJWTCookie(res, '', {maxAge: '0'});
            // }

            if (req.user && !req.user.isActive) {
                setJWTCookie(res, '', {maxAge: '0'});
                res.locals.isBanned = true;
                req.logOut();
                req.session.destroy(err => {
                    console.log(err);
                });
            }
            next();
        });
        this.express.use('/', AuthRouter);
        this.express.use('/oauth', OAuthRouter);
        this.express.use('/', ServerPostRouter);
        this.express.use('/', baseRoutes);
    }
}

export default new AppClass().express;