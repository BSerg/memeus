import mongoose from 'mongoose';
import BigNumber from 'bignumber.js';
import BigNumberSchema from 'mongoose-bignumber';
import { placeBuyOrder } from '../payments/index';

export const CurrencyRate = {
    type: BigNumberSchema,
    scale: 8,
    rounding: BigNumber.ROUND_FLOOR,
    default: 1
}

export let RatesSchema = new mongoose.Schema({
    USD_RUB: CurrencyRate,
    WAVES_USD: CurrencyRate,
    TOKEN_RUB: CurrencyRate,
    TOKEN_WAVES: CurrencyRate
}, {
    timestamps: true,
    collection: 'rates'
});

// RatesSchema.post('findOneAndUpdate', async (rates, next) => {
//     let _rates = await Rates.findById(rates._id);
//     _rates.TOKEN_WAVES = _rates.TOKEN_RUB.dividedBy(_rates.WAVES_USD.times(_rates.USD_RUB));
//     await _rates.save();
//     console.log('TOKEN_WAVES rate has beed updated', _rates.TOKEN_WAVES.toFixed(8));
//     next();
// });

// RatesSchema.pre('save', function(next) {
//     if (this.isModified('TOKEN_WAVES') && process.env.WAVES_ALLOW_PLACE_ORDER) {
//         placeBuyOrder();
//     };
//     next();
// });

export let Rates = mongoose.model('PaymentsSettings', RatesSchema);

export let RevenueSchema = new mongoose.Schema({
    dateFrom: {type: Date, required: true},
    dateTo: {type: Date, required: true},
    amount: CurrencyRate,
}, {
    timestamps: true,
    collection: 'revenues'
});

RevenueSchema.post('save', async (doc, next) => {
    let totalTokenAmount = new BigNumber(0);
    let totalRevenue = new BigNumber(0);
    let revenues = await Revenue.find().populate('payment');
    for (let i = 0; i < revenues.length; i++) {
        let revenue = revenues[i];
        totalRevenue = totalRevenue.plus(revenue.amount);
        let _transactions = await Transaction.find({dateFrom: {$gte: revenue.dateFrom}, dateTo: {$lt: revenue.dateTo}});
        _transactions.forEach(t => {
            totalTokenAmount = totalTokenAmount.plus(t.value);
        });
    }
    if (!totalTokenAmount.equals(0)) {
        await Rates.update({}, {$set: {TOKEN_RUB: totalRevenue.dividedBy(totalTokenAmount)}}, {$upsert: true});
    }
    next();
});

export let Revenue = mongoose.model('Revenue', RevenueSchema);

export const TokenValue = {
    type: BigNumberSchema,
    scale: 8,
    rounding: BigNumber.ROUND_FLOOR,
    default: 0
};

export const paymentType = {
    READER: 'reader',
    AUTHOR: 'author',
    REFERAL: 'referal'
}

export const paymentStatus = {
    NEW: 'new',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed'
};

export const shareStatus = {
    NEW: 'new',
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
    CANCELED: 'canceled'
}

export let PaymentShareSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    share: {
        total: TokenValue,
        reader: TokenValue,
        author: TokenValue,
        referal: TokenValue,
    },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
});

export let PaymentSchema = new mongoose.Schema({
    prevPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    tokenAmount: TokenValue,
    sharedTokenAmount: TokenValue,
    status: { type: String, enum: Object.values(paymentStatus), default: paymentStatus.NEW },
    progress: { type: Number, min: 0, max: 100, default: 0 },
}, {
        timestamps: true,
        collection: 'payments'
    });

PaymentSchema.statics.getOrCreate = async function (cond, data) {
    let payment = await Payment.findOne(cond);
    if (!payment) {
        payment = new Payment(data);
        await payment.save();
    }
    return payment;
};

PaymentSchema.methods.recalcProgress = async function () {
    let transQuery = Transaction.find({ payment: this._id });
    let transCompletedCount = await transQuery.where('status').equals(transactionStatus.COMPLETED).count().exec();
    let transTotalCount = await transQuery.count().exec();
    if (transTotalCount) {
        this.progress = transCompletedCount / transTotalCount;
    }
};

PaymentSchema.path('dateTo').validate(function (dateTo) {
    return dateTo > this.dateFrom;
});

PaymentSchema.path('prevPayment').validate(function (prevPayment) {
    if (!prevPayment) {
        return true;
    } else {
        return this.dateFrom.toString() == prevPayment.dateTo.toString();
    }
});

PaymentSchema.pre('save', async function (next) {
    await this.recalcProgress();
    next();
});

export let Payment = mongoose.model('Payment', PaymentSchema);


export let WalletSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: String,
    balance: {
        total: TokenValue,
        reader: TokenValue,
        author: TokenValue,
        referal: TokenValue,
    },
    isSystem: { type: Boolean, default: false },
    oldWalletId: { type: mongoose.Schema.Types.ObjectId, required: false }
}, {
    timestamps: true,
    collection: 'wallets'
});

WalletSchema.statics.findOneOrCreate = async (cond, data) => {
    let wallet = await Wallet.findOne(cond);
    if (!wallet) {
        wallet = new Wallet(data);
        await wallet.save();
    }
    return wallet;
};

// WalletSchema.post('save', async (wallet, next) => {
//     if (!wallet.address) {
//         let job = await createAccountTask(wallet._id);
//     }
//     next();
// });

export let Wallet = mongoose.model('Wallet', WalletSchema);

export const transactionType = {
    RAW: 'raw',
    PAYMENT: 'payment',
    WITHDRAWAL: 'withdrawal',
}

export const transactionStatus = {
    NEW: 'new',
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled'
}

export let TransactionSchema = new mongoose.Schema({
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: false, index: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    type: { type: String, enum: Object.values(transactionType), default: transactionType.RAW },
    status: { type: String, enum: Object.values(transactionStatus), default: transactionStatus.NEW },
    value: TokenValue,
    inf: mongoose.Schema.Types.Mixed,
}, {
        timestamps: true,
        collection: 'transactions'
    });

TransactionSchema.pre('save', async function (next) {
    if (this.isModified('status') && this.status == transactionStatus.COMPLETED && this.wallet) {
        let wallet = await Wallet.findById(this.wallet);
        switch (this.type) {
            case transactionType.PAYMENT:
                wallet.balance.total = wallet.balance.total.plus(this.value);
                wallet.balance.reader = wallet.balance.reader.plus(this.inf.reader);
                wallet.balance.author = wallet.balance.author.plus(this.inf.author);
                wallet.balance.referal = wallet.balance.referal.plus(this.inf.referal);
                await wallet.save();
                break;
            case transactionType.WITHDRAWAL:
                wallet.balance = {
                    total: new BigNumber(0),
                    reader: new BigNumber(0),
                    author: new BigNumber(0),
                    referal: new BigNumber(0)
                };
                await wallet.save();
                break;
        }
    }
    next();
});

// TransactionSchema.post('save', async (transaction, next) => {
//     if (transaction.payment && transaction.status == transactionStatus.COMPLETED) {
//         let payment = Payment.findById(transaction.payment._id || transaction.payment);
//         if (payment) {
//             payment.recalcProgress();
//             await payment.save();
//         }
//     }
//     next();
// });

export let Transaction = mongoose.model('Transaction', TransactionSchema);