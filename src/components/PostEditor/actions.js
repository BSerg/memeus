import {api} from 'utils/api';
import {Actions} from '../../utils/constants';
import axios from 'axios';

let newPostTimeout;

export function createPost(caption, media, captchaResponse, url) {

    return (dispatch) => {
        let fd = new FormData();
        fd.append('caption', caption);
        
        media.forEach((m) => {
            fd.append('media', m);
        });
        if (url) {
            fd.append('url', url);
        }
        fd.append('captchaResponse', captchaResponse);
        
        let cancelSource = axios.CancelToken.source();
        dispatch({type: Actions.EDITOR_SET_UPLOADING, cancelSource});


        const config = {
            // onUploadProgress: progressEvent => console.log(progressEvent.loaded),
            cancelToken: cancelSource.token,
        }


        api.post('posts', fd, config).then((response) => {
            newPostTimeout = setTimeout(() => {
                dispatch({type: Actions.EDITOR_SET_NEW_POST, newPost: response.data});
            }, 0);
            
        }).catch((err) => {
            console.log(err.response.status);
            dispatch({type: Actions.EDITOR_SET_ERROR, errorCode: err.response.status});
        })
    }
}

export function setDefault() {
    return (dispatch, getState) => {
        let cancelSource = getState().editor.cancelSource;
        cancelSource && cancelSource.cancel();
        newPostTimeout && clearTimeout(newPostTimeout);
        dispatch({type: Actions.EDITOR_SET_DEFAULT});
    }
    
}

export function openPreview(path) {
    return {type: Actions.MEDIA_PREVIEW_SET, path};
}
