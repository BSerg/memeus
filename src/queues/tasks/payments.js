import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import uuid from 'uuid';
import Queue from 'bull';
import probe from 'probe-image-size';
import request from 'request';

import {keepFile} from '../../utils';
import {errorCode} from '../../utils/constants';

export const paymentsTask = {
    CREATE_ACCOUNT: 'createAccount',
    PROCESS_TRANSACTION: 'processTransaction',
};

export const paymentsQueue = new Queue(process.env.PAYMENTS_QUEUE || 'paymentsProcessing', {
    redis: {
        host: process.env.REDIS_HOST, 
        port: process.env.REDIS_PORT, 
        db: process.env.REDIS_DB, 
        password: process.env.REDIS_PASSWORD
    },
    settings: {
        lockDuration: process.env.PAYMENTS_QUEUE_LOCK_DURATION || 30000
    }
});

export let createAccountTask = async walletId => {
    return await paymentsQueue.add({walletId, route: paymentsTask.CREATE_ACCOUNT});
};

export let processTransactionTask = async transactionId => {
    return await paymentsQueue.add({transactionId, route: paymentsTask.PROCESS_TRANSACTION});
};