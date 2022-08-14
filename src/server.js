import dotenv from 'dotenv';
dotenv.config();

import newrelic from 'newrelic';
import * as http from 'http';
import * as debug from 'debug';
import socketIO from 'socket.io';
import socketRedis from 'socket.io-redis';
import socketioJWT from 'socketio-jwt';
import redis from 'redis';

import App from './App';
import initSocketIO from './utils/socket';
import {mediaProcessingBroker, paymentsBroker} from './queues';
import {currencyRateProcess,  wavesRateProcess} from './payments';

App.set('port', process.env.PORT);

const server = http.createServer(App);

initSocketIO(server);
mediaProcessingBroker();
paymentsBroker();
// currencyRateProcess();
// wavesRateProcess();

server.listen(process.env.PORT);

