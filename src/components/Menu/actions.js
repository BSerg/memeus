import {Actions} from 'utils/constants';

export function toggleMenuOpen(open=false) {
    return {type: Actions.MENU_SET_OPEN, open}
}