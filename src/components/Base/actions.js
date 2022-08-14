import {Actions} from '../../utils/constants';
import {api} from '../../utils/api';
import {textToHtml} from '../../utils/format';
// import {api} from '../../utils';

export function setScreenSize(width, height) {
    return {type: Actions.SCREEN_SET_SIZE, width, height}
}

export function registerVisitTick() {
    return (dispatch, getState, {emit}) => {
        try {
            emit('visitTick');
        } catch(err) {}
        
    }
}

export function getNews() {
    return (dispatch, getState) => {
        if (!getState().userData.user) {
            return;
        }
        api.get('/news').then((response) => {
            try {
                const newsItem = response.data[0];

                let readItems = localStorage.getItem('news') ? localStorage.getItem('news').split(',') : [];
                if (readItems.indexOf(newsItem._id) !== -1) {
                    return;
                }
                else {
                    readItems.push(newsItem._id);
                    localStorage.setItem('news', readItems.join(','));
                }

                const language = getState().localization.language;
                if (newsItem.text[language]) {
                    dispatch({type: Actions.NEWS_SET, text: textToHtml(newsItem.text[language])})
                }

            } catch(err) {console.log(err);}
        }).catch((err) => {})
    }
}