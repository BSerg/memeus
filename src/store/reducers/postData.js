import {Actions} from '../../utils/constants';

// import {mockItem, mockItem2, mockItem3, mockItem4} from 'utils/mockItems';

const defaultCommentsState = {
    comments: [],
    commentsLoading: false,
    commentUploading: false,
    commentsPage: 1,
    commentsHasMore: false,
    commentsFromId: null,
    myPostedComments: [],
    newComments: [],
}


const defaultState = {
    item: null,
    loading: false,
    error: false,
    ...defaultCommentsState,
}

export default function postData(state=defaultState, action) {
    switch(action.type) {
        case Actions.POST_GET_START:
            return {...state, item: null, loading: true, error: false};
        case Actions.POST_SET:
            return {...state, item: {...action.item}, loading: false, error: false};
        case Actions.POST_ERROR:
            return {...state, item: null, loading: false, error: true};
        case Actions.POST_CLEAR:
            return {...defaultState};
        case Actions.POST_COMMENTS_LOADING:
            return {...state, commentsLoading: true};
        case Actions.POST_COMMENTS_SET:
            return {...state, comments: action.items, commentsLoading: false, commentUploading: false,
                newComments: action.newItems || state.newComments,
                commentsPage: action.page || 1, commentsHasMore: !!action.hasMore, commentsFromId: action.fromId};
        case Actions.POST_COMMENTS_MY_POSTED_ADD:
            let myPostedComments = [...state.myPostedComments];
            myPostedComments.push(action.id);
            return {...state, myPostedComments}
        case Actions.POST_COMMENT_UPLOADING:
            return {...state, commentUploading: !!action.uploading};
        case Actions.POST_COMMENTS_NEW_COMMENTS_SET:
            return {...state, newComments: action.items || []}
    }
    return state;
}