import {Router} from 'express';
import User from '../models/UserModel';
import {handleRedirectURL, passRedirectURL} from './handlers';
import {signJWT, signJWTAsync, setJWTCookie, setJWTLocalStorage} from '../utils';
import passport from 'passport';

export class OAuthRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    handleJWT(req, res, next) {
        if (req.isAuthenticated) {
            signJWTAsync(req.user.getPayload()).then((token) => {
                setJWTCookie(res, token);
            }).then(() => {
                next();
            });
        }
    }

    init() {
        // Facebook
        this.router.get(
            '/facebook',
            // passRedirectURL,
            passport.authenticate('facebook', {scope: ['user_friends']})
        );
        this.router.get(
            '/facebook/callback', 
            passport.authenticate('facebook', {
                failureRedirect: '/login'
            }),
            this.handleJWT,
            handleRedirectURL
        );

        // vk.com
        this.router.get(
            '/vk',
            // passRedirectURL,
            passport.authenticate('vk')
        );
        this.router.get(
            '/vk/callback', 
            passport.authenticate('vk', {
                failureRedirect: '/login'
            }),
            this.handleJWT,
            handleRedirectURL
        );

        // Twitter
        this.router.get(
            '/twitter',
            // passRedirectURL,
            passport.authenticate('twitter')
        );
        this.router.get(
            '/twitter/callback', 
            passport.authenticate('twitter', {
                failureRedirect: '/login'
            }),
            this.handleJWT,
            handleRedirectURL
        );

        // Google
        this.router.get(
            '/google',
            // passRedirectURL,
            passport.authenticate('google', {scope: ['email']})
        );
        this.router.get(
            '/google/callback', 
            passport.authenticate('google', {
                failureRedirect: '/login'
            }),
            this.handleJWT,
            handleRedirectURL
        );

    }
}

export default new OAuthRouter().router;