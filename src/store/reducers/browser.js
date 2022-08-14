import {detect} from 'detect-browser';
const browserData = detect() || {};

const initialState = {
    isMobile: browserData.os === "Android OS" || browserData.os === "iOS",
}

export default function browser(state=initialState, action) {
    return state;
}