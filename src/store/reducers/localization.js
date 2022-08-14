import {Actions} from 'utils/constants';
import {loadCaptionData} from 'utils/localizationUtils';



function getLocale() {
    try {
        return localStorage.getItem('lang') || window.__DEFAULT_LOCALE__ || 'ru';
    }
    catch(err) {
        return 'ru';
    }
}
const lang = getLocale();

const initialState = {
    language: lang,
    captions: loadCaptionData(lang),
};


export default function localization(state=initialState, action) {
    if (action.type === Actions.LOCALIZATION_SET_LANGUAGE_DATA) {
        return {...state, ...action.languageData}
    }
    return state;
}