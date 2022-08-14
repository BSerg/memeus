import socketio from 'socket.io';
import socketioJWT from 'socketio-jwt';
import socketioRedis from 'socket.io-redis';
import emitter from 'socket.io-emitter';
import redis from 'redis';

import {cacheVisitTick, cachePostView} from './cache';
import Post, {postStatus} from '../models/PostModel';

export default server => {
    initSocketApp(server);    
};

const subClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
    password: process.env.REDIS_PASSWORD
});
const pubClient = subClient.duplicate();

export let initSocketApp = server => {
    const io = socketio(server);
    io.adapter(socketioRedis({subClient, pubClient}));
    
    io.on('connection', socketioJWT.authorize({
        secret: process.env.SECRET
    })).on('authenticated', socket => {

        console.log(`User ${socket.id} connected`);

        socket.on('test', data => {
            console.log(data);
        });
    
        socket.join(socket.decoded_token.sub);
        
        socket.on('subscribeComments', postSlug => {
            Post.findOne({slug: postSlug, status: postStatus.PUBLISHED}).then(post => {
                if (post) socket.join(postSlug);
            })
        });

        socket.on('unsubscribeComments', postSlug => {
            socket.leave(postSlug);
        });

        socket.on('postView', data => {
            let postSlug = data;
            cachePostView(postSlug, socket.decoded_token.sub);
        });
        
        socket.on('visitTick', () => {
            cacheVisitTick(socket.decoded_token.sub, socket.id);
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.id} disconnected`);
        });
    });
}

export const socketEmitter = emitter(redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
    password: process.env.REDIS_PASSWORD,
}));