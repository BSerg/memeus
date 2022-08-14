import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/UserModel';
import { Wallet } from '../src/models/paymentModels';

let db;

beforeAll(async () => {
    mongoose.connect('mongodb://localhost:27017/memeus-test', { 
        useMongoClient: true, 
        config: {autoIndex: true}
    });
    db = mongoose.connection;
});

afterAll(() => {
    db.dropDatabase(() => {
        console.log('Mongo test db dropped');
        process.exit(0);
    });
});

test('Creating wallet on new user registration', async () => {
    let [user, created] = await User.findOneOrCreateAsync({username: 'john'}, {username: 'john', nickname: 'john'});
    console.log(user);
    let wallet = await Wallet.findOne({owner: user});
    expect(wallet).not.toBeNull();
});