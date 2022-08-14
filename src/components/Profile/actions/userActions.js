import {Actions} from 'utils/constants';
import {loadCaptionData} from 'utils/localizationUtils';
import {api} from 'utils/api';

export function uploadAvatar(file) {
    return (dispatch, getState) => { 
        const user = getState().userData.user;
        if (!user) {
            return;
        }
        dispatch({type: Actions.USER_SET_AVATAR_UPLOADING});
        let fd = new FormData();
        fd.append('avatar', file);

        api.patch('/users/me/', fd).then((response) => {
            const avatar = {...user.avatar, path: window.URL.createObjectURL(file)}
            dispatch({type: Actions.USER_SET_AVATAR, avatar});
        }).catch((err) => {});
    }
}

export function setNicknameError(error) {
    return {type: Actions.USER_SET_ERROR, errorData: {nickname: error}};
}

export function saveNewNickname(nickname) {
    return (dispatch, getState) => {
        let fd = new FormData();
        fd.append('nickname', nickname);
        setTimeout(() => {
            api.patch('/users/me/', fd).then((response) => {
                let user = {...getState().userData.user};
                user.nickname = nickname;
                dispatch({type: Actions.USER_SET, user});
            }).catch((err) => {
                dispatch(setNicknameError(true));
            });
        }, 2000);
    }
}

export function setLanguage(language) {
    return (dispatch, getState) => {
        if (getState().localization.language === language) {
            return;
        }
        localStorage.setItem('lang', language);
        dispatch({type: Actions.LOCALIZATION_SET_LANGUAGE_DATA, languageData: {
            language, captions: loadCaptionData(language)
        }});
    }
}


export function getMe() {
    return (dispatch, getState) => {
        let user = getState().userData.user;
        if (!user) {
            return;
        }
        dispatch({type: Actions.USER_GET_ME});
        api.get('users/me/').then((response) => {
            let updatedUser = {...user, ...response.data};
            dispatch({type: Actions.USER_SET, user: updatedUser});
        }).catch((err) => {});
        
    }
}