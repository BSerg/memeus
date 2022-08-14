import {Router, Request, Response, NextFunction} from 'express';
import {checkIsAdmin} from '../../handlers';

// import Wallet, {Transaction} from '../../../models/WalletModel';
import {Wallet, Transaction, transactionType, Payment, paymentStatus, transactionStatus} from '../../../models/paymentModels';
import { BigNumber } from 'bignumber.js';

export class AdminStatRouter {

    constructor() {
        this.router = Router();
        this.init();
    }

    async getStats(req, res, next) {
        let paymentTransactions = await Transaction.find({
            type: transactionType.PAYMENT, 
            status: transactionStatus.COMPLETED
        });

        let data = {
            totalTokensGiven: new BigNumber(0), 
            totalTransactions: 0, 
            byType: {
                reader: new BigNumber(0),
                author: new BigNumber(0),
                referal: new BigNumber(0)
            }
        };
        paymentTransactions.forEach(t => {
            data.totalTokensGiven = data.totalTokensGiven.plus(t.value);
            data.totalTransactions++;
            data.byType.reader = data.byType.reader.plus(t.inf.reader || 0);
            data.byType.author = data.byType.author.plus(t.inf.author || 0);
            data.byType.referal = data.byType.referal.plus(t.inf.referal || 0);
        });

        res.json(data);
    }

    init() {
        this.router.get('/', checkIsAdmin, this.getStats);
    }

}

export default new AdminStatRouter().router;