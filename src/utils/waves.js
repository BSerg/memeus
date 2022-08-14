import base58 from 'base-58';
import request from 'request';

const _env = process.env;

let _request = (url, method = 'GET', data = null, baseUrl = _env.WAVES_NODE_URL) => {
    return new Promise((resolve, reject) => {
        let defaults = {
            json: true,
            headers: {api_key: _env.WAVES_NODE_API_KEY},
            baseUrl: baseUrl,
            url: url,
            method: method
        };
        if (data) defaults.body = data;
        return request(defaults, (err, res, body) => {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

export let addressIsValid = async address => {
    return await _request(`/addresses/validate/${address}`);
};

export let createAccount = async () => {
    return await _request('/addresses', 'POST');
};

export let getAccounts = async () => {
    return await _request('/addresses');
};

export let getBalance = async (address, assetId = null) => {
    return await _request(assetId ? `/assets/balance/${address}/${assetId}` : '/addresses/balance/' + address);
};

export let issueAsset = async data => {
    return await _request('/assets/issue', 'POST', data);
};

export let transferAsset = async data => {
    return await _request('/assets/transfer', 'POST', data);
};

export let transfer = async (sender, recipient, amount, attachment = null, assetId = _env.WAVES_NODE_ASSET_ID) => {
        let data = {
            assetId,
            sender,
            recipient,
            amount,
            fee: 100000,
        };
        if (attachment) {
            data.attachment = base58.encode(new Buffer(JSON.stringify(attachment)));
        }
        return await transferAsset(data)
};

export let getTransaction = async transactionId => {
    return await _request(`/transactions/info/${transactionId}`);
};

export let getAccountTransactions = async (address, limit = 10) => {
    return await _request(`/transactions/address/${address}/limit/${limit}`);
};

export let createOrder = async (params) => {
    let now = new Date().getTime();
    let exp = now + 61 * 1000;
    let orderData = {
        senderPublicKey: _env.WAVES_MAIN_ADDRESS_PUBLIC_KEY,
        matcherPublicKey: _env.WAVES_MATCHER_PUBLIC_KEY,
        assetPair: {
            amountAsset: _env.WAVES_NODE_ASSET_ID || params.amountAsset,
            priceAsset: null || params.priceAsset,
        },
        orderType: "buy" || params.orderType,
        price: params.price,
        amount: params.amount,
        timestamp: params.timestamp || now,
        expiration: params.expiration || exp,
        matcherFee: 300000
    };

    return await _request('/assets/order', 'POST', orderData);
};

export let placeOrder = async (params) => {
    let data = await createOrder(params);
    if (data.id) {
        return await _request('/matcher/orderbook', 'POST', data, _env.WAVES_DEX_URL);
    } else {
        throw data;
    }
};

export let cancelOrder = async orderId => {
    return await _request(`/matcher/orders/cancel/${orderId}`, 'POST', null, _env.WAVES_DEX_URL);
};

export let deleteOrderbook = async (amountAssetId = _env.WAVES_NODE_ASSET_ID, priceAssetId = 'WAVES') => {
    return await _request(`/matcher/orderbook/${amountAssetId}/${priceAssetId}`, 'DELETE', null, _env.WAVES_DEX_URL);
};