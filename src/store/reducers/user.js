import {Actions} from 'utils/constants';
import cookie from 'js-cookie';
import jwt_decode from 'jwt-decode';

let user;

try {  
    const jwt = cookie.get('jwt');
    user = jwt_decode(jwt) || null;
} catch(err) {
    user = null;
}

const initialState = {
    user,
    error: false,
    loading: false,
    avatarUploading: false,
    fullData: false,
    errors: {},
    wsConnected: false,
};

export default function userData(state=initialState, action) {
    switch(action.type) {
        case Actions.USER_SET:
            return {...state, user: {...action.user}, loading: false, fullData: true};
        case Actions.USER_GET_ME:
            return {...state, loading: true};
        case Actions.USER_ERROR:
            return {...state, error: true, loading: false};
        case Actions.USER_SET_AVATAR:
            let user = {...state.user};
            user.avatar = action.avatar || null;
            return {...state, user, avatarUploading: false};
        case Actions.USER_SET_AVATAR_UPLOADING:
            return {...state, avatarUploading: true};
        case Actions.USER_SET_ERROR:
            return {...state, errors: {...state.errors, ...action.errorData}};
        case Actions.USER_SET_WS_CONNECTED:
            return {...state, wsConnected: !!action.connected}

        default:
            return state;
    }
}