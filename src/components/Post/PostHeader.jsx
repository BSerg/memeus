import React from 'react';
import {Link} from 'react-router-dom';

import {connect} from 'react-redux';

export function PostHeader({post, isList, to, isMobile}) {

    let caption = post.caption;

    if (!caption) {
        try {
            if (post.media[0].type === 'animation' && isMobile) {
                caption = 'Gif';
            }
        } catch(err) {}
    }

    if (!caption) {
        return null;
    }

    return isList ? 
        <Link key="caption" className="post__caption" to={to}><h2>{caption}</h2></Link> 
        : 
        <h2>{caption}</h2>;
}

const mapStateToProps = (state) => {
    return {
        isMobile: state.browser.isMobile,
    }
}

export default connect(mapStateToProps, null)(PostHeader);