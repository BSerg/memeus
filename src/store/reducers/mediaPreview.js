import {Actions} from '../../utils/constants';


const defaultState = {
    path: null,
}

export default function mediaPreview(state=defaultState, action) {

    switch (action.type) {
        case Actions.MEDIA_PREVIEW_SET:
            return {...state, path: action.path };
        case Actions.MEDIA_PREVIEW_CLEAR:
            return {...state, path: null};
        default:
            return state;
    }
}
