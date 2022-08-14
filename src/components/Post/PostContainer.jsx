import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {Loading, ModalContainer} from 'components/shared';
import Post from './Post';
import {Helmet} from 'react-helmet';
import ReactSVG from 'react-svg';
import CloseIcon from './images/close_white.svg';
import {ErrorContent} from 'components/Error/Error';
import ContentBanner from 'components/banners/ContentBanner';
import {getItem, clearPost} from './actions/actions';

import PostComments from './PostComments/PostComments';

import './styles/PostContainer.scss';

export class PostContainer extends Component {
    constructor() {
        super();
        this.bannerIndex = Math.floor(Math.random() * 100);
    }

    componentDidMount() {
        this.props.getItem();
        document.body.style.overflow = 'hidden';
    }

    _getToUrl() {
        switch(this.props.listType) {
            case 'user':
                return this.props.nickname ? `/u/${this.props.nickname}` : '/';
            case 'best':
                return '/best';
            case 'fresh':
                return '/fresh';
            case 'subscriptions':
                return '/subscriptions';
            case 'my':
                return '/manage/posts';
            default:
                return '/';
        }
    }

    componentWillUnmount() {
        document.body.style.overflow = 'auto';
        this.props.clearPost();
    }

    render() {
        let {post, error, loading, captions, loginModalOpen} = this.props;
        if (loginModalOpen) {
            return null;
        }
        const to = (post || error) ? this._getToUrl() : null;
        const title = post && (`${post.caption ? post.caption : '#' + post.slug} | MEMEUS`);
        let imageUrl;
        try {
            imageUrl = post.media[0].preview.path;
        }
        catch(err) {
            imageUrl = ''
        }
        return <ModalContainer className="post_container" closeHref={to}>
            {error && <div className="post__error__content">
                <ErrorContent code={404} text={captions["postError"]} />
            </div>}
            {
                post && <Helmet>
                    <title>{title}</title>
                    <meta property="og:type" content="article"/>
                    <meta property="og:title" content={title}/>
                    <meta property="og:url" content={'/m/' + post.slug}/>
                    <meta property="og:image" content={imageUrl}/>
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content={title} />
                    <meta name="twitter:image:src" content={imageUrl} />

                </Helmet>
            }
            {loading && <Loading />}
            {post && <Post post={post} />}
            {process.env.IS_BROWSER && process.env.COMMENTS_ENABLED && post && <PostComments />}
            
        </ModalContainer>
    }
}

const mapStateToProps = (state) => {
    return {
        post: state.postData.item,
        error: state.postData.error,
        loading: state.postData.loading,
        captions: state.localization.captions,
        loginModalOpen: state.menu.loginModalOpen,
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getItem: () => {dispatch(getItem(ownProps.slug))},
        clearPost: () => {dispatch(clearPost())}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostContainer);

