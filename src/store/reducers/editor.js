import {Actions} from 'utils/constants';

const defaultState = {
    newPost: null,
    error: false,
    errorCode: null,
    uploading: false,
    progress: 0,
    cancelSource: null,
}

export default function editor(state=defaultState, action) {
    switch(action.type) {
        case Actions.EDITOR_SET_DEFAULT:
            return {...defaultState};
        case Actions.EDITOR_SET_UPLOADING:
            return {...state, uploading: true, progress: 0, cancelSource: action.cancelSource};
        case Actions.EDITOR_SET_PROGRESS:
            return {...state, progress: action.progress || 0};
        case Actions.EDITOR_SET_NEW_POST:
            return {...state, uploading: false, newPost: action.newPost};
        case Actions.EDITOR_SET_ERROR:
            return {...state, uploading: false, error: true, errorCode: action.errorCode};
    }
    return state;
}