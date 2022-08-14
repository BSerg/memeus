import React from 'react';
import {connect} from 'react-redux';

import {openPreview} from './actions/actions';


export function PostCommentInputPreview({media, openPreview}) {
    let src
    try {
        src = window.URL.createObjectURL(media[0]);
    } catch(err) {};
    if (!src) {
        return null;
    }

    return <div className="post__comment_media">
        <div style={{ backgroundImage: `url("${src}")` }} onClick={() => { openPreview(src) }} />
    </div>
}

const mapDispatchToProps = (dispatch) => {
    return {
        openPreview: (path) => { dispatch(openPreview(path)) }
    }
}

export default connect(null, mapDispatchToProps)(PostCommentInputPreview);