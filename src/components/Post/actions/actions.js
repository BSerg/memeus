import {Actions} from 'utils/constants';
import {api} from 'utils/api';

function getPreloadedPost(slug) {
    if (window.__PRELOADED_POST__) {
        let post = window.__PRELOADED_POST__;
        try {
            if (post.slug === slug && post.media[0].default.path) {
                return post;
            }
        }
        catch(err) {}
        
    }
    return null;
}

export function getItem(slug) {
    return(dispatch, getState) => {
        let {items} = getState().itemList;
        let item = items.find((val) => {
            return val.slug === slug;
        });
        if (item) {
            dispatch({type: Actions.POST_SET, item});
        }
        else {
            let preloadedPost = getPreloadedPost(slug);
            if (preloadedPost) {
                dispatch({type: Actions.POST_SET, item: preloadedPost});
            }
            else {
                dispatch({type: Actions.POST_GET_START});
                api.get(`posts/${slug}`).then((response) => {
                    dispatch({type: Actions.POST_SET, item: response.data});
                }).catch((err) => {
                    dispatch({type: Actions.POST_ERROR});
                });
            }
            

        }
    }
}

export function clearPost() {
    return {type: Actions.POST_CLEAR};
}

export function setLike(post, like) {
    return (dispatch, getState) => {
        // let postItem = getState().postData.item;
        // let items = [...getState().itemList.items];
        api.post(`posts/${post.slug}/like`, {value: like}).then((response) => {
            let likes = (post.likes || 0) + (like - (post.like || 0));
            let data = {};
            data[post.slug] = likes;
            let likeValue = {};
            likeValue[post.slug] = like;
            dispatch({type: Actions.ITEM_LIST_LIKES_SET, data, likeValue});
            // if (postItem && postItem.slug === post.slug) {
                // dispatch({type: Actions.POST_SET, item: {...postItem, like, likes}});
            // }
            // let arrIndex = items.findIndex((val) => { return val.slug === post.slug });
            // if (arrIndex > -1) {
                // items[arrIndex] = {...items[arrIndex], like, likes};
                // dispatch({type: Actions.ITEM_LIST_SET_ITEMS, items});
            // }
        }).catch((err) => {  });
    }
}

export function markAsOld(post, value=true) {
    return (dispatch, getState) => {
        api.post(`posts/${post.slug}/old`, {value}).then((response) => {
            let val = {};
            val[post.slug] = value;
            dispatch({type: Actions.ITEM_LIST_OLD_SET, value: val});

        }).catch((err) => {
            console.log(err);
        }); 
    }
} 

export function report(postSlug, reason, captchaResponse) {
    return (dispatch, getState) => {
        
        api.post(`posts/${postSlug}/report`, {type: reason, captchaResponse}).then((response) => {
            dispatch({type: Actions.NOTIFICATIONS_ADD, text: getState().localization.captions["postReportSent"]});
        }).catch((err) => {
            
        });
    }
}

export function deletePost(postSlug) {
    return (dispatch, getState) => {
        api.delete(`posts/${postSlug}`).then(() => {
            let deletedItems = [...getState().itemList.deletedItems];
            deletedItems.push(postSlug);
            dispatch({type: Actions.ITEM_LIST_SET_DELETED, deletedItems});
        }).catch((err) => {  });
    }
}

export function restorePost(postSlug) {
    return (dispatch, getState) => {

        api.patch(`posts/${postSlug}/restore`).then((resp) => {
            let deletedItems = [...getState().itemList.deletedItems].filter((item) => {
                return item !== postSlug;
            });
            dispatch({type: Actions.ITEM_LIST_SET_DELETED, deletedItems});
        }).catch((err) => {});
        
    }
}

export function openLoginModal() {
    return {type: Actions.LOGIN_MODAL_SET_OPEN, open: true};
}

export function registerView(postSlug) {
    return (dispatch, getState, {emit}) => {
        try {
            emit('postView', postSlug);
        } catch(err) {}
        
    }
}