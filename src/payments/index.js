import {watchFiatCurrencyRate, watchWavesRate} from '../utils/payments';
import {Rates} from '../models/paymentModels';
import { BigNumber } from 'bignumber.js';
import { cancelOrder, placeOrder, getBalance, deleteOrderbook } from '../utils/waves';

export let currencyRateProcess = () => {
    watchFiatCurrencyRate(data => {
        if (data && data.Valute && data.Valute.USD) {
            Rates.findOneAndUpdate({}, {$set: {USD_RUB: new BigNumber(data.Valute.USD.Value)}}, {upsert: true}).then(res => {
                console.log('USD_RUB rate updated: ', data.Valute.USD.Value);
            }).catch(err => {
                console.log(err);
            });
        }
    }, 60 * 60 * 1000);
};

export let wavesRateProcess = () => {
    watchWavesRate(data => {
        if (data && data.length && data[0].price_usd) {
            Rates.findOneAndUpdate({}, {$set: {WAVES_USD: new BigNumber(data[0].price_usd)}}, {upsert: true}).then(res => {
                console.log('WAVES_USD rate updated: ', data[0].price_usd);
            }).catch(err => {
                console.log(err);
            });
        }
    }, 2 * 60 * 1000);
};

let currentBuyOrderId = null;

export let placeBuyOrder = async () => {

    try {
        await deleteOrderbook();
    } catch(err) {
        console.log('ERROR ON DELETING ORDER BOOK' + JSON.stringify(err));
    }

    let rates = await Rates.findOne();
    let price = rates.TOKEN_WAVES.times(100000000);
    let _balance;
    try {
        _balance = await getBalance(process.env.WAVES_NODE_MAIN_ADDRESS);
    } catch(err) {
        console.log('ERROR ON GETTING BALANCE ' + JSON.stringify(err));
        return;
    }

    let balance = new BigNumber(_balance.balance).minus(100000000);

    if (balance.lessThanOrEqualTo(0)) {
        console.log('Not enought WAVES on the balance!');
        return;
    }

    console.log(balance, price)

    let amount = balance.dividedBy(price).floor();

    if (amount.greaterThan(1000)) {
        amount = new BigNumber(1000);
    }

    amount = amount.times(100000000);

    if (amount.equals(0)) {
        console.log('Amount is equals 0');
        return;
    }

    let order;

    try {
        order = await placeOrder({price: price.toNumber(), amount: amount.toNumber()});
    } catch(err) {
        console.log('ERROR ON PLACING ORDER ' + JSON.stringify(err));
        return;
    }

    console.log('ORDER DATA ' + JSON.stringify(order));

    if (order && order.message) {
        currentBuyOrderId = order.message.id;
        console.log('ORDER HAS BEEN PLACED: ' + order.message.id);  
    }

};