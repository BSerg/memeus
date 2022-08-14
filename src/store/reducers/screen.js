import {Actions} from 'utils/constants';

export function setScreenSize(width, height) {
    return {type: Actions.SCREEN_SET_SIZE, width, height};
}

const initialState = {
    width: window.innerWidth,
    height: window.innerHeight,
    isDesktop: window.innerWidth >= 768,
}

export default function screen(state=initialState, action) {
    switch(action.type) {
        case Actions.SCREEN_SET_SIZE:
            let width = parseInt(action.width, 10) || 0,
            height = parseInt(action.height, 10) || 0,
            isDesktop = width >= 768;
            return {...state, width, height, isDesktop};
        default:
            return state;
    }
}