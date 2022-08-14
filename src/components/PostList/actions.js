import {api} from 'utils/api';
import {Actions} from 'utils/constants';
import axios from 'axios';
import {API_PAGE_SIZE} from 'utils/commonConstants';


export function getPosts(listType, nickname=null) {
    return (dispatch, getState) => {
        let {page, items, cancelSource, preloadedDataChecked} = getState().itemList;
        if (!preloadedDataChecked) {
            dispatch({type: Actions.ITEM_LIST_CHECK_PRELOADED});
            try {
                const preloadedData = window.__PRELOADED_ITEM_DATA__;
                if (listType === preloadedData.listType) {
                    dispatch({ type: Actions.ITEM_LIST_SET_DATA, 
                        items: preloadedData.items, hasMore: preloadedData.hasMore, 
                        page: preloadedData.hasMore ? 2 : 1, listType });
                    return;
                }
            } catch(err) {}
        }
        cancelSource && cancelSource.cancel('cancelled');
        cancelSource = axios.CancelToken.source();
        dispatch({type: Actions.ITEM_LIST_GET_START, listType, cancelSource, nickname});
        getItems(listType, nickname, page, cancelSource).then((newItems) => {
            const hasMore = newItems.length === API_PAGE_SIZE;
            newItems = newItems.filter((ni) => {
                return items.findIndex((i) => { 
                    return !!i && !!ni && i.slug === ni.slug }) === -1 ;
            });
            
            if (newItems.length) {
                items = items.concat(newItems);
            }
            
            const newPage = hasMore ? page + 1 : page;
            dispatch({ type: Actions.ITEM_LIST_SET_DATA, items, page: newPage, hasMore });
        }).catch((err) => {
            if (!axios.isCancel(err)) {
                console.log(err);
            }
        });
    }
}


export function changeListType(listType, nickname=null) {
    return (dispatch) => {
        dispatch({ type: Actions.ITEM_LIST_SET_DATA, items: [], page: 1, hasMore: true, loading: true});
        setTimeout(() => {
            dispatch(getPosts(listType, nickname));
        }, 0);
    }
}

export function getItems(listType, nickname, page, cancelSource) {
    return new Promise((resolve, reject) => {
        api.get('posts', {params: {page, pageSize: API_PAGE_SIZE, type: listType, nickname}, cancelToken: cancelSource.token}).then((response) =>{
            resolve(response.data);
        }).catch((err) => {
            reject(err);
        })
    })
}

export function clear() {
    return {type: Actions.ITEM_LIST_CLEAR}
}