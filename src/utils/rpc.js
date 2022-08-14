import RPC from 'redis-rpc';

let _env = process.env;

const rpc = new RPC({
    scope: process.env.CACHE_PREFIX + ':rpc',
    redis: {
        host: _env.REDIS_HOST,
        port: _env.REDIS_PORT,
        db: _env.REDIS_DB,
        password: _env.REDIS_PASSWORD,
    }
})

export default rpc;

