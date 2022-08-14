
import {Actions} from 'utils/constants';
const initialState = {
    items: [],
    
}

export default function notifications(state=initialState, action) {

    if (action.type === Actions.NOTIFICATIONS_ADD) {
        let items = [...state.items];
        items.push(action.text);
        return {...state, items};
    }
    return state;
}