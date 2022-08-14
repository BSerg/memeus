import io from 'socket.io-client';
import {Actions} from '../utils/constants';
import cookie from 'js-cookie';
import jwt_decode from 'jwt-decode';

let user;
const jwt = cookie.get('jwt');

try {  
    user = jwt_decode(jwt) || null;
} catch(err) {
    user = null;
}

import {handlePostPublished} from './actions/wsActions';
import {receiveNewComment} from '../components/Post/PostComments/actions/actions';

const socketClient = io(process.env.SOCKETIO_URL);

export const websocketInit = (store) => {
    socketClient.on('connect', () => {
        socketClient.emit('authenticate', {token: jwt});
    });
    socketClient.on('authenticated', () => {
        store.dispatch({ type: Actions.USER_SET_WS_CONNECTED, connected: true });
    });
    socketClient.on('unauthorized', function(msg) {
        store.dispatch({ type: Actions.USER_SET_WS_CONNECTED, connected: false });
    });
    socketClient.on('disconnect', () => {
        store.dispatch({ type: Actions.USER_SET_WS_CONNECTED, connected: false });
    });
    socketClient.on('postPublished', (payload) => {
        handlePostPublished(store, payload);
    });
    socketClient.on('newComment', (payload) => {
        store.dispatch(receiveNewComment(payload));
    });
};

export const emit = ( type, payload ) => { 
    socketClient.emit( type, payload )
};