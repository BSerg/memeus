import {Actions} from 'utils/constants';

export function handlePostPublished(store, payload) {
    if (!payload || !payload.slug) {
        return;
    }
    const {postData, itemList} =  store.getState();
    if (postData.item && postData.item.slug === payload.slug) {
        store.dispatch({type: Actions.POST_SET, item: {...payload}});        
    }
    let itemIndex = itemList.items.findIndex((v) => { return v.slug === payload.slug });
    if (itemIndex > -1) {
        let updatedItems = [...itemList.items];
        updatedItems[itemIndex] = {...payload};
        store.dispatch({type: Actions.ITEM_LIST_SET_ITEMS, items: updatedItems});
    }
    else if (itemList.type === 'fresh' || itemList.type === 'my') {
        let updatedItems = [{...payload}, ...itemList.items];
        store.dispatch({type: Actions.ITEM_LIST_SET_ITEMS, items: updatedItems});
    }
}