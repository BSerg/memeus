import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import userData from './reducers/user';
import menu from './reducers/menu';
import screen from './reducers/screen';
import postData from './reducers/postData';
import itemList from './reducers/itemList';
import localization from './reducers/localization';
import bannerData from './reducers/bannerData';
import browser from './reducers/browser';
import editor from './reducers/editor';
import paymentData from './reducers/paymentData';
import notifications from './reducers/notifications';
import info from './reducers/info';
import authorData from './reducers/author';
import mediaPreview from './reducers/mediaPreview';
import news from './reducers/news';

import {websocketInit, emit} from './websocketStore';

const middleware = applyMiddleware(thunk.withExtraArgument({emit}));
const reducers = combineReducers({userData, menu, screen, postData, itemList, localization, bannerData, 
    browser, editor, paymentData, notifications, info, authorData, mediaPreview, news});

let createdStore = createStore(reducers, middleware);

websocketInit(createdStore);
export const store = createdStore;
