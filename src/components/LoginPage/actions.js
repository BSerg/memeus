import {Actions} from 'utils/constants';

export function closeModal() {
    return {type: Actions.LOGIN_MODAL_SET_OPEN, open: false};
}