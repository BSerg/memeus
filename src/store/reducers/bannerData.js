
import {sideBanners, contentBanners} from 'utils/bannerItemsAlt';
import {Actions} from 'utils/constants';



const initialState = {
    sideBanners: [...sideBanners],
    currentSideBannerIndex: Math.floor(Math.random() * sideBanners.length),
    contentBanners: [...contentBanners],
}



export default function bannerData(state=initialState, action) {
    switch(action.type) {
        case Actions.BANNERS_SET_SIDE_BANNER_INDEX:
            return {...state, currentSideBannerIndex: action.newIndex}
    }
    return state;
}