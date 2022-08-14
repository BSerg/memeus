import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_URL, { 
    useMongoClient: true, 
    config: {autoIndex: true}
});

let db = mongoose.connection;

db.on('error', error => {
    console.error('MONGODB CONNECTION ERROR: ' + error);
}); 

db.on('open', () => {
    console.log('MONGODB OPENED');
});

export default db;