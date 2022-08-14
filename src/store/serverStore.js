import {createStore, combineReducers} from 'redux';
import localization from './reducers/localization';

function userData() { return { user: null }; }
function menu() { return {open: false}}
function screen() { return { isDesktop: false }}

function itemList() {
    return {
        items: [],
        type: 'trending',
        deletedItems: [],
        likes: {},
        likeValues: {},
        oldPostMarks: {},
    }
}

function news() {
    return { item: null }
}

function browser() { return { isMobile: true } }
function bannerData() { return { contentBanners: [] } }
function notifications() { return { items: []}}

function mediaPreview() { return {path: null} }

const reducers = combineReducers({userData, menu, screen, localization, itemList, browser, bannerData, 
    notifications, mediaPreview, news});


export const store = createStore(reducers);