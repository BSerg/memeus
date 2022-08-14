import {api} from 'utils/api';

export function getHtml(infoType) {
    return (dispatch) => {
        api.get('/info', {params: {type: infoType}}).then((res) => {
            dispatch({type: 'INFO_HTML_SET', html: res.data.html});
        }).catch((err) => {
            dispatch({type: '', html: res.data.html});
        })
    }
}