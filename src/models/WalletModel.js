import mongoose from 'mongoose';

import {round} from '../utils';

export let WalletSchema = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    address: String,
    balance: {
        total: {type: Number, default: 0},
        reader: {type: Number, default: 0},
        author: {type: Number, default: 0},
        referal: {type: Number, default: 0},
    },
    isSystem: {type: Boolean, default: false}
}, {
    timestamps: true,
    collection: '_wallets'
});

WalletSchema.statics.findOneOrCreate = function(conditions, data) {
    return new Promise((resolve, reject) => {
        const Wallet = this.model('Wallet');
        Wallet.findOne(conditions).then(wallet => {
            if (wallet == null) {
                let wallet = new Wallet(data);
                wallet.save().then(() => {
                    resolve(wallet);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(wallet);
            }
        }).catch(err => {reject(err)});
    });
    
};

let Wallet = mongoose.model('_Wallet', WalletSchema);
export default Wallet;

export const transactionType = {
    READER: 1,
    AUTHOR: 2,
    REFERAL: 3
};

export const transactionStatus = {
    NEW: 'new',
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
    CANCELED: 'canceled'
};

export let TransactionSchema = new mongoose.Schema({
    wallet: {type: mongoose.Schema.Types.ObjectId, ref: '_Wallet'},
    type: {type: Number},
    value: {type: Number, default: 0},
    dateFrom: {type: Date, required: true},
    dateTo: {type: Date, required: true}
}, {
    timestamps: true,
    collection: '_transactions'
});

TransactionSchema.path('dateTo').validate(function(dateTo) {
    return dateTo > this.dateFrom;
});

TransactionSchema.pre('save', async function(next) {
    if (this.isNew && this.wallet) {
        let updateData = {};
        switch (this.type) {
            case transactionType.READER:
                updateData = {$inc: {'balance.reader': this.value, 'balance.total': this.value}};
                break;
            case transactionType.AUTHOR:
                updateData = {$inc: {'balance.author': this.value, 'balance.total': this.value}};
                break;
            case transactionType.REFERAL:
                updateData = {$inc: {'balance.referal': this.value, 'balance.total': this.value}};
                break;
        }
        let wallet = await Wallet.findOneAndUpdate({_id: this.wallet}, updateData, {new: true});
        next();
    } else {
        next();
    }
});

export let Transaction = mongoose.model('_Transaction', TransactionSchema);