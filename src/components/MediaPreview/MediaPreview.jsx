import React from 'react';
import {connect} from 'react-redux';

import {Actions} from '../../utils/constants';

import './MediaPreview.scss';

export function MediaPreview({path, close}) {

    if (!path) {
        return null;
    }

    let content;
    if (path.endsWith('.mp4')) {
        content = <video autoPlay={true} playsInline={true} loop={true}>
            <source src={path} type="video/mp4"/>
        </video>;
    }
    else {
        content = <img src={path}/>
    }

    return <div className="media_preview" onClick={close}>
        {content}
    </div>

}

const mapStateToProps = (state) => {
    return {
        path: state.mediaPreview.path,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        close: () => { dispatch({type: Actions.MEDIA_PREVIEW_CLEAR}) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MediaPreview);