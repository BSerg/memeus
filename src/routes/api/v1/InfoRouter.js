import {Router, Request, Response, NextFunction} from 'express';
import marked from 'marked';

import {AGREEMENT} from '../../../utils/texts/agreement';
import {CONFIDENTIALITY} from '../../../utils/texts/confidentiality';


export class InfoRouter {


    constructor() {
        this.router = Router();
        this.init();
    }

    getInfo(req, res, next) {

        console.log(req.query.type);
        switch(req.query.type) {
            case 'agreement':
                return res.send({html: AGREEMENT});
            case 'confidentiality':
                return res.send({html: CONFIDENTIALITY});
            default:
                return res.sendStatus(404);
        }
            

        
    }

    init() {
        this.router.get('/', this.getInfo);
    }
}

export default new InfoRouter().router;