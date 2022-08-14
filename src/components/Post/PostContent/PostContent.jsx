import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {Loading} from 'components/shared';
import {PostContentVideo, PostContentVideoMobile} from './PostContentVideo';

export function ContentWrapper({to, children}) {
    return <Link key="content" to={to}><div className="post__content">{children}</div></Link>
}

export function PostIsProcessing({text}) {
    return <div className="post__content_processing">
        <div>{text}</div>
        <Loading />
    </div>;
}



export function PostContent({post, isList, listType, captions, isMobile, to}) {
    if (post.status === 'new') {
        return <PostIsProcessing text={captions['postProcessing']} />
    }
    const media = post.media[0];
    let content;
    switch(media.type) {
        case ('animation'):
            content = isMobile ? <PostContentVideoMobile media={media} /> :  <PostContentVideo isList={isList} media={media} isMobile={isMobile}/>;
            break;
        case('photo'):
            let imgSrc = isList ? media.preview.path : media.default.path
            content = <img src={imgSrc} alt=""/>;
            break;
        default:
            return null;
    }
    if (isList && !(isMobile && media.type === 'animation')) {
        return <Link key="content" to={to}><div className="post__content">{ content }</div></Link>
    }
    return <div className="post__content" key="content">{ content }</div>

}

const mapStateToProps = (state) => {
    return {
        listType: state.itemList.type,
        captions: state.localization.captions,
        isMobile: state.browser.isMobile,
    }
}

export default connect(mapStateToProps, null)(PostContent);