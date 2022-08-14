import {mockItems} from 'utils/mockItems';
import {Actions} from 'utils/constants';
// import {processPostItems} from 'utils/process';

const defaultState = {
    items: [],
    type: null,
    nickname: null,
    loading: false,
    page: 1,
    hasMore: true,
    cancelSource: null,
    deletedItems: [],
    preloadedDataChecked: false,
    likes: {},
    likeValues: {},
    oldPostMarks: {},
}

export default function itemList(state=defaultState, action) {
    switch(action.type) {
        case Actions.ITEM_LIST_GET_START:
            return {...state, loading: true, type: action.listType, cancelSource: action.cancelSource, nickname: action.nickname};
        case Actions.ITEM_LIST_SET_DATA:
            let listType = action.listType || state.type;
            return {...state, items: action.items, loading: false, hasMore: action.hasMore, 
                page: action.page, loading: !!action.loading, type: listType};
        case Actions.ITEM_LIST_SET_ITEMS:
            return {...state, items: action.items};
        case Actions.ITEM_LIST_SET_ERROR:
            return {...state, hasMore: false};
        case Actions.ITEM_LIST_CLEAR:
            return {...defaultState, preloadedDataChecked: true};
        case Actions.ITEM_LIST_SET_DELETED:
            return {...state, deletedItems: action.deletedItems || []};
        case Actions.ITEM_LIST_CHECK_PRELOADED:
            return {...state, preloadedDataChecked: true};
        case Actions.ITEM_LIST_LIKES_SET:
            let likes = {...state.likes, ...action.data};
            let likeValues = {...state.likeValues, ...action.likeValue};
            return {...state, likes, likeValues};
        case Actions.ITEM_LIST_OLD_SET:
            let oldPostMarks = {...state.oldPostMarks, ...action.value};
            return {...state, oldPostMarks};
        default:
            return state;
    }
}