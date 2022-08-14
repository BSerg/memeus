import {api} from 'utils/api';

import {Actions} from '../../../utils/constants';

export function getAuthor(nickname) {
    return (dispatch) => {
        dispatch({type: Actions.AUTHOR_LOADING});

        api.get(`/users/${nickname}`).then((response) => {
            dispatch({type: Actions.AUTHOR_SET, item: response.data});
        }).catch((err) => { 
            dispatch({type: Actions.AUTHOR_ERROR}); 
        });
    }
}

export function toggleSubscription() {
    return (dispatch, getState) => {
        const author = getState().authorData.item;
        if (!author) {
            return null;
        }
        const {isSubscribed, nickname} = author;
        const apiUrl = isSubscribed ? `/users/${nickname}/unsubscribe` : `/users/${nickname}/subscribe`;
        let subscribers = author.subscribers + 1 * (isSubscribed ? -1 : 1);
        if (subscribers < 0) subscribers = 0;
        api.post(apiUrl).then((r) => {
            dispatch({type: Actions.AUTHOR_SET, item: {...author, isSubscribed: !isSubscribed, subscribers}});
        }).catch((err) => {});

    }
}

const SUB_PAGE_SIZE = 50;

export function getSubscriptionItems(nickname, listType) {
    return (dispatch, getState) => {
        const {relatedPage, related} = getState().authorData;
        dispatch({type: Actions.AUTHOR_RELATED_LOADING});
        api.get(`/users/${nickname}/${listType}`, {params: { pageSize: SUB_PAGE_SIZE, page: relatedPage} }).then((r) => {

            const hasMore = r.data.length === SUB_PAGE_SIZE;
            const page = hasMore ? relatedPage + 1 : relatedPage;

            const newItems = r.data.filter((ni) => {
                return related.findIndex((i) => { 
                    return !!i && !!ni && i.nickname === ni.nickname }) === -1 ;
            });

            const items = [...related, ...newItems];
            dispatch({ type: Actions.AUTHOR_RELATED_SET, items, page, hasMore });

        }).catch((err) => { console.log(err) })
    }  
}

export function reset() {
    return { type: Actions.AUTHOR_RELATED_SET, items: [], page: 1, hasMore: false };
}