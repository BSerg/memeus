import Limiter from 'express-limiter';
import redis from 'redis';
import app from '../App';

let redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
    password: process.env.REDIS_PASSWORD,
})

export default Limiter(app, redisClient);

