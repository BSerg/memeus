import {Actions} from '../../../../utils/constants';
import {api} from '../../../../utils/api';
import postData from '../../../../store/reducers/postData';

const PAGE_SIZE = 25;

export function getItems() {

    return (dispatch, getState) => {
        let postData = getState().postData;
        if (!postData.item || !postData.item.slug) {
            return;
        }

        let page = postData.commentsPage || 1;
        dispatch({type: Actions.POST_COMMENTS_LOADING});
        api.get(`/posts/${postData.item.slug}/comments`, {params: {fromId: postData.commentsFromId, page, pageSize: PAGE_SIZE}}).then((response) => {
            if (!response.data[0]) {
                dispatch({type: Actions.POST_COMMENTS_SET, items: [], hasMore: false, fromId: null});
                return null;
            }
            postData = getState().postData;
            if (!postData.item || !postData.item.slug || postData.item.slug !== response.data[0].post.slug) {
                return null;
            }
            const hasMore = response.data.length === PAGE_SIZE;
            let items = postData.comments;
            let newItems = response.data.filter((ni) => {
                return items.findIndex((i) => { 
                    return !!i && !!ni && i._id === ni._id }) === -1 ;
            });
            if (newItems.length) {
                items = items.concat(newItems);
            }
            page += 1;
            const fromId = items[0] ? items[0]._id : null;
            dispatch({type: Actions.POST_COMMENTS_SET, items, hasMore, fromId, page});
        }).catch((err) => {  });
    }
}

export function sendComment(text, media) {
    return (dispatch, getState) => {
        const post = getState().postData.item;
        if (!post || !post.slug) {
            return;
        }
        let fd = new FormData();
        fd.append('text', text);
        if (media && media.length) {
            media.forEach((m) => {
                fd.append('media', m);
            });
        }
        dispatch({type: Actions.POST_COMMENT_UPLOADING, uploading: true});
        api.post(`/posts/${post.slug}/comments`, fd).then((response) => {  
            if (response.data && response.data.status === 'published') {

                let items =  [...getState().postData.comments];
                let newItems = getState().postData.newComments.filter((ni) => {
                    return getState().postData.newComments.findIndex((i) => { 
                        return !!i && !!ni && i._id === ni._id }) === -1 ;
                });

                items.splice(0, 0, response.data);
                dispatch({type: Actions.POST_COMMENTS_SET, items, newItems});
            }
            else if (response.data) {
                dispatch({type: Actions.POST_COMMENTS_MY_POSTED_ADD, id: response.data._id});
            }
        }).catch((err) => { });
    }
}


export function deleteComment(comment) {
    return (dispatch) => {
        if (!comment || !comment.post || !comment.post.slug || !comment._id) {
            return null
        }
        api.delete(`/posts/${comment.post.slug}/comments/${comment._id}`).then((response) => {}).catch((err) => {});
    }
    
}

export function openPreview(path) {
    return { type: Actions.MEDIA_PREVIEW_SET, path }
}

export function subscribeComments(postSlug) {
    return (dispatch, getState, {emit}) => {
        try {
            emit('subscribeComments', postSlug);
        } catch(err) {}
        
    }
}

export function unsubscribeComments(postSlug) {
    return (dispatch, getState, {emit}) => {
        emit('unsubscribeComments', postSlug);
    }
}

export function receiveNewComment(comment) {
    return (dispatch, getState) => {
        const {postData, userData} = getState();


        try {
            if (comment.post.slug !== postData.item.slug) {
                return null;
            }
            
            if (postData.myPostedComments.find((id) => { return id === comment._id })) {
                comment.isOwner = true;
                let items =  [...getState().postData.comments];
                items.splice(0, 0, comment);
                dispatch({type: Actions.POST_COMMENTS_SET, items});
            }
            else {
                let items =  [...getState().postData.newComments];
                items.splice(0, 0, comment);
                dispatch({type: Actions.POST_COMMENTS_NEW_COMMENTS_SET, items});
            }

        } catch(err) { }
    }
}

export function addNewComments() {
    return (dispatch, getState) => {
        const {postData} = getState();
        try {
            let items = [...postData.comments];
            let newItems = [...postData.newComments];

            newItems = newItems.filter((ni) => {
                return items.findIndex((i) => { 
                    return !!i && !!ni && i._id === ni._id }) === -1 ;
            });

            items.splice(0, 0, ...newItems);
            dispatch({type: Actions.POST_COMMENTS_SET, items, newItems: []});

        } catch(err) {

        }
        

    }
}