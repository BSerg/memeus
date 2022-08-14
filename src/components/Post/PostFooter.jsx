import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import DislikeIcon from './images/dislike.svg';
import LikeIcon from './images/like.svg';
import OldIcon from './images/old.svg';
import ReportIcon from './images/report.svg';
import PostButton from './PostButton';
import ShareIcon from './images/share.svg';
import CommentsIcon from './images/comments.svg';

import {setLike, markAsOld, openLoginModal} from './actions/actions';

export class  PostFooter extends PureComponent {

    constructor(props) {
        super(props);
        this.setLike = this.checkUser(this.setLike);
        this.markAsOld = this.checkUser(this.markAsOld);
    }

    checkUser(func) {
        if (!this.props.user) {
            return this.openLoginModal;
        }
        return func;
    }

    openLoginModal() {
        this.props.openLoginModal();
    }

    setLike(like) {
        clearTimeout(this.likeTimeout);
        this.likeTimeout = setTimeout(() => {
            like = like === this.props.like ? 0 : like;
            this.props.setLike(like);
        }, 0);
    }

    markAsOld() {
        clearTimeout(this.likeTimeout);
        this.likeTimeout = setTimeout(() => {
            this.props.markAsOld(!this.props.old);
        }, 0);

    }

    render() {

        const { setShareOpen, like, likes, old, isList, post, to, isDesktop } = this.props;

        return <div className="post__footer">
            <PostButton onClick={this.setLike.bind(this, 1)} icon={LikeIcon} isActive={like === 1}/>
            <span className="post__footer_likes">{likes || 0}</span>
            <PostButton onClick={this.setLike.bind(this, -1)} icon={DislikeIcon} isActive={like === -1} />
            <div className="post__footer__divider"/>
            <PostButton onClick={this.markAsOld.bind(this)} className="--bigger-icon" icon={OldIcon} isActive={old} />
            {process.env.COMMENTS_ENABLED && isList && [
                <div className="post__footer__divider" key="divider"/>,
                <PostButton className="--bigger-icon" icon={CommentsIcon} key="comments" to={to} >
                    <span>{isDesktop && (post.comments || 0)}</span>
                </PostButton>
            ] }
            <div className="filler"/>
            <PostButton icon={ShareIcon} onClick={setShareOpen} />

            
        </div>
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        isDesktop: state.screen.isDesktop,
        user: state.userData.user,
        like: state.itemList.likeValues[ownProps.post.slug] !== undefined ? state.itemList.likeValues[ownProps.post.slug] : ownProps.post.like,
        likes: state.itemList.likes[ownProps.post.slug] !== undefined ? state.itemList.likes[ownProps.post.slug] : ownProps.post.likes,
        old: state.itemList.oldPostMarks[ownProps.post.slug] !== undefined ? state.itemList.oldPostMarks[ownProps.post.slug] : ownProps.post.old,
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setLike: (like) => { dispatch(setLike(ownProps.post, like)) },
        openLoginModal: () => { dispatch(openLoginModal()); },
        markAsOld: (v) => {
            dispatch(markAsOld(ownProps.post, v));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostFooter);
