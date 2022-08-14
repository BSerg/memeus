import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import PostComment from './PostComment';
import PostCommentInput from './PostCommentInput';

import {Loading} from '../../shared';

import {getItems, subscribeComments, unsubscribeComments, addNewComments} from './actions/actions';

import './styles/PostComments.scss';


export class PostComments extends PureComponent {

    componentWillReceiveProps(nextProps) {
        if (!this.props.wsConnected && nextProps.wsConnected) {
            setTimeout(() => {
                if (this.props.post && this.props.post.slug) {
                    this.props.subscribe(this.props.post.slug);
                }
            }, 1000);
            
        }
        else if (this.props.wsConnected && !nextProps.wsConnected) {
            if (this.props.post && this.props.post.slug) {
                this.props.unsubscribe(this.props.post.slug);
            }
        }
    }

    componentDidMount() {
        this.props.getItems();
        if (this.props.post && this.props.post.slug) {
            this.props.subscribe(this.props.post.slug);
        }
    }

    componentWillUnmount() {
        if (this.props.post && this.props.post.slug) {
            if (this.props.post && this.props.post.slug) {
                this.props.unsubscribe(this.props.post.slug);
            }
        }
    }

    render() {
        const {post, items, loading, user, getItems, hasMore, captions, newComments, addNewComments} = this.props;
        return <div className="post__comments">

            {user && <PostCommentInput post={post} />}
            {!!newComments && <div className="post__comments__more_button" onClick={addNewComments}>{captions["commentsNew"]}: {newComments}</div>}
            <div id="post__comments_list">
                { items.map((item) => {
                    if (!item || !item._id) {
                        return null;
                    }
                    return <PostComment key={item._id} item={item} />
                }) }
            </div>
            {loading && <Loading />}
            {!loading && hasMore && <div className="post__comments__more_button" onClick={getItems}>{captions["commentsHasMore"]}</div>}
            
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.userData.user,
        post: state.postData.item,
        items: state.postData.comments || [],
        loading: state.postData.commentsLoading,
        hasMore: state.postData.commentsHasMore,
        captions: state.localization.captions,
        wsConnected: state.userData.wsConnected,
        newComments: state.postData.newComments && state.postData.newComments.length,
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        getItems: () => {dispatch(getItems())},
        subscribe: (postSlug) => { dispatch(subscribeComments(postSlug)) },
        unsubscribe: (postSlug) => { dispatch(unsubscribeComments(postSlug)) },
        addNewComments: () => { dispatch(addNewComments()) },
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(PostComments);