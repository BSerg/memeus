import {Actions} from 'utils/constants';

const initialState = {
    open: false,
    loginModalOpen: false,
};


export default function menu(state=initialState, action) {
    switch(action.type) {
        case Actions.MENU_SET_OPEN:
            // return state
            return { ...state, open: !!action.open};
        case Actions.LOGIN_MODAL_SET_OPEN:
            return {...state, loginModalOpen: !!action.open};
        default:
            return state;
    }
}