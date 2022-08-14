import {Router, Request, Response, NextFunction} from 'express';
import User from '../models/UserModel';
import {setJWTCookie, setJWTLocalStorage} from '../utils';
import {passRedirectURL, handleJWT} from './handlers';
import passport from 'passport';


export class AuthRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    logout(req, res, next) {
        let redirectURL = '/';
        if (req.isAuthenticated()) {
            if (req.session.redirectURL) {
                redirectURL = req.session.redirectURL;
            }
            if (req.query.global) {
                req.user.refreshTokenId();
            }
            req.logOut();
            req.session.destroy(err => {
                console.log(err);
            });
        }        
        setJWTCookie(res, '', {maxAge: '0'});
        res.redirect(redirectURL);
    }   

    success(req, res, next) {
        if (!req.isAuthenticated()) res.redirect('/login');
        if (req.user.isAdmin && process.env.ADMIN_PANEL_URL) {
            return res.redirect(process.env.ADMIN_PANEL_URL);
        }
        res.render('index', {user: req.user, token: req.cookies && req.cookies.jwt});
    }

    init() {
        this.router.post('/login',
            passport.authenticate('local', { failureRedirect: process.env.ADMIN_PANEL_URL}), 
            handleJWT,
            (req, res) => {
                res.redirect(process.env.ADMIN_PANEL_URL);
            }
        );
        this.router.get('/logout', this.logout);
        this.router.get('/success', this.success);
    }
}

export default new AuthRouter().router;