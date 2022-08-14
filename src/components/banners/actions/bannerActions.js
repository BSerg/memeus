import {Actions} from 'utils/constants';

export function renewSideBanner() {

    return (dispatch, getState) => {
        let {sideBanners, currentSideBannerIndex} = getState().bannerData;
        let newIndex = currentSideBannerIndex + 1;
        if (newIndex >= sideBanners.length) {
            newIndex = 0;
        }
        dispatch({type: Actions.BANNERS_SET_SIDE_BANNER_INDEX, newIndex});
    }
}