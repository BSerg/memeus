
const defaultState = {
    html: '',
    loading: false,
}
export default function info(state=defaultState, action) {
    if (action.type === 'INFO_HTML_SET') {
        return {...state, html: action.html};
    }
    return state;
}