import {Actions} from '../../utils/constants';


const initialState = {
    item: null,
    loading: false,
    related: [],
    relatedLoading: [],
    relatedPage: 1,
    relatedHasMore: false,
}

export default function authorData(state=initialState, action) {
    switch(action.type) {
        case Actions.AUTHOR_LOADING:
            return {...state, item: null, loading: true, error: false};
        case Actions.AUTHOR_SET:
            return {...state, item: action.item, loading: false, error: false};
        case Actions.AUTHOR_ERROR:
            return {...state, error: true, item: null, loading: false};
        case Actions.AUTHOR_RELATED_LOADING:
            return {...state, relatedLoading: true};
        case Actions.AUTHOR_RELATED_SET:
            return {...state, related: action.items || [], relatedLoading: false, 
                relatedPage: action.page || 1, relatedHasMore: !!action.hasMore}
        default:
            return state;
    }
}