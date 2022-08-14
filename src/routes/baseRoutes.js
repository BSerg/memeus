import {Router} from 'express';

class BaseRouter {
    router;

    getDefault(req, res, nextFunction) {
        res.render('index.ejs');
    }

    constructor() {
        this.router = Router();
        this.init();

    }

    init() {
        this.router.get('/*', this.getDefault);
    }
}

export const baseRoutes = new BaseRouter().router;