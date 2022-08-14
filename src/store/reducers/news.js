import {Actions} from '../../utils/constants';

const initialState = {
    text: null,
};

export default function news(state=initialState, action) {
    switch(action.type) {
        case Actions.NEWS_SET:
            return {...state, text: action.text};
        default:
            return state;
    }
}