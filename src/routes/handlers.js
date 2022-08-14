import passport from 'passport';
import {signJWT, signJWTAsync, setJWTCookie} from '../utils';


export function passRedirectURL(req, res, next) {
    if (req.query.redirect_url) {
        req.session.redirectURL = req.query.redirect_url;
    }
    next();
}

export function handleRedirectURL(req, res, next) {
    res.redirect(req.session.redirectURL || '/');
}

export function passReferal(req, res, next) {
    if (req.query.ref) {
        req.session.referal = req.query.ref;
    }
    next();
}

export function handlePassportErrorJSON(err, req, res, next) {
    let status = err.status || 500;
    return res.status(status).json({error: err});
}


export function handleJWT(req, res, next) {
    if (req.isAuthenticated()) {
        signJWTAsync(req.user.getPayload()).then((token) => {
            setJWTCookie(res, token);
        }).then(() => {
            next();
        });
    }
}
    
export function passportedHandler(...handlers) {
    return [
        passport.authenticate('jwt', {session: false, failWithError: false}, null), 
        ...handlers
    ];
}

export function checkIsAdmin(req, res, next) {
    passport.authenticate('jwt', {session: false, failWithError: false}, (err, user, info) => {
        if (user && user.isAdmin) {
            return next();
        }
        else {
            res.sendStatus(403);
        }
    } )(req, res, next);
}
