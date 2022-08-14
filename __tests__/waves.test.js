import dotenv from 'dotenv';
dotenv.config({path: '.test.env'});

import {createAccount, getBalance, getAccounts, issueAsset, transfer, getTransaction} from '../src/utils/waves';
import { BigNumber } from 'bignumber.js';

const _env = process.env;

let sleep = (delay) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}; 

test('Create waves account', async () => {
    let res = await createAccount();
    expect(res.address).not.toBeUndefined();
});

test('Get accounts list', async () => {
    let res = await getAccounts();
    expect(res.length).toBeGreaterThan(0);
});

test('Get balance', async () => {
    let addresses = await getAccounts();
    let res = await getBalance(addresses[0]);
    expect(res.balance).toBeDefined();
    expect(res.balance).toBeGreaterThanOrEqual(0);
});

test('Issue asset', async () => {
    let addresses = await getAccounts();
    let data = {
        "name": "Memeus Token",
        "quantity": 100000000000000,
        "description": "Some description",
        "sender": "3FkDgartgeSYbTGvSCyvUTrqURa2apPTE4E",
        "decimals": 8,
        "reissuable": false,
        "fee": 100000000
    };
    let res = await issueAsset(data);
    expect(res.error).toBeUndefined();
    await sleep(5000);
    let balance = await getBalance('3FkDgartgeSYbTGvSCyvUTrqURa2apPTE4E', res.assetId);
    expect(balance.balance).toBe(100000000000000);
}, 10000);

test('Issue asset + transfer + get transaction', async () => {
    let addresses = await getAccounts();
    let data = {
        "name": "Memeus Token",
        "quantity": 100000000000000,
        "description": "Some description",
        "sender": addresses[0],
        "decimals": 8,
        "reissuable": false,
        "fee": 100000000
    };
    let res = await issueAsset(data);
    await sleep(10000);
    expect(res.error).toBeUndefined();

    let assetId = res.assetId;
    let balance = await getBalance(addresses[0], assetId);
    expect(balance.balance).toBe(100000000000000);
    let resTransfer = await transfer(addresses[0], addresses[1], 1000000, null, assetId);
    await sleep(60000);
    let balance1 = await getBalance(addresses[1], assetId);
    expect(balance1.balance).toBe(1000000);
    let transactions = await getAccountTransactions(addresses[0]);
    expect(transactions.length).toBeGreaterThanOrEqual(1);
}, 100000);