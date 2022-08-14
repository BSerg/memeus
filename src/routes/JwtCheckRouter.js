import {Router} from 'express';
import {setJWTCookie} from '../utils';
import {passportedHandler} from './handlers';
import passport from 'passport';


class JwtCheckRouter {
    router;

    constructor() {
        this.router = Router();
        this.init();

    }

    getDefault(req, res, next) {
        // if (!req.user || !req.user.isActive) {
            // setJWTCookie(res, '', {maxAge: '0'});
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
    }

    

    init() {
        this.router.get('/*', passport.authenticate('session'), this.getDefault);
    }
}

export default new JwtCheckRouter().router;