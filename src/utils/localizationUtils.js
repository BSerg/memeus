import {Languages} from 'utils/constants';
import captionDataJSON from 'utils/captions.json';

export function loadCaptionData(language) {
    let langIndex = Languages.findIndex((el, index, arr) => { return el.code === language });
    if (langIndex < 0) {
        langIndex = 0;
    }
    let captions = {};
    Object.keys(captionDataJSON).forEach((k) => {
        captions[k] = captionDataJSON[k][langIndex] || captionDataJSON[k][0] || '';
    });
    return captions;
}