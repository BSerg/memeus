import {Actions} from 'utils/constants';

export function notifyUrlCopy() {
    return (dispatch, getState) => {
        let text = getState().localization.captions["notificationUrlCopy"];
        dispatch({type: Actions.NOTIFICATIONS_ADD, text});
    }
}