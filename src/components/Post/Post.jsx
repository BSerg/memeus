import React, {Component, PureComponent} from 'react';
import {connect} from 'react-redux';

import PostAuthor from './PostAuthor';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';
import PostShare from './PostShare';
import PostReport from './PostReport';
import PostContent from './PostContent/PostContent';
import PostDeleted from './PostDeleted';
import PostMenu from './PostMenu';

import {deletePost, openLoginModal, registerView} from './actions/actions';

import './styles/Post.scss';

export class Post extends PureComponent {
    element;
    isScrolling;
    readFixed;
    scrollInterval;
    isVisible;
    viewTimeout;
    likeTimeout;

    constructor(props) {
        super(props);
        this.state = {shareOpen: false, reportOpen: false, isReported: false};
        this.onScroll = this.onScroll.bind(this);
        this.onIntervalScroll = this.onIntervalScroll.bind(this);
        this.processView = this.processView.bind(this);
        this.readFixed = false;
        this.isVisible = false;
        this.isScrolling = false;
        this.setReportOpen = this.checkUser(this.setReportOpen);
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

    setShareOpen(open) {
        this.setState({shareOpen: open});
    }

    setReportOpen(open) {
        this.setState({reportOpen: open});
    }

    setIsReported() {
        this.setState({reportOpen: false, isReported: true});
    }

    processView() {
        this.props.registerView();
        clearInterval(this.scrollInterval);
    }

    checkVisibility() {
        let {screenHeight, user, deleted} = this.props;
        if (!user || deleted) {
            return;
        }
        let {height, top, bottom} = this.element.getBoundingClientRect();
        if (bottom < 0) {
            window.removeEventListener('scroll', this.onScroll);
            return;
        }

        let isVisible = (top >= 20 && bottom <= screenHeight) || ((screenHeight / 2) > top && (screenHeight / 2) < bottom );
        if (isVisible === this.isVisible) {
            return;
        }
        this.isVisible = isVisible;
        if (!this.isVisible) {
            clearTimeout(this.viewTimeout);
        }
        else {
            this.viewTimeout = setTimeout(this.processView, 2000);
        }
    }

    onIntervalScroll() {
        if (!this.isScrolling) {
            return;
            
        }
        this.checkVisibility();
        this.isScrolling = false;
    }

    onScroll() {
        this.isScrolling = true;
    }

    componentDidMount() {
        this.checkVisibility();
        window.addEventListener('scroll', this.onScroll);
        this.scrollInterval = setInterval(this.onIntervalScroll, 300);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.onScroll);
        clearInterval(this.scrollInterval);
        clearTimeout(this.viewTimeout);
        clearTimeout(this.likeTimeout);
    }

    render() {

        const {post, isList, deleted, deletePost, listType, likes, like, old, nickname} = this.props;
        if (deleted) {
            return <PostDeleted post={post} isList={isList}/>
        }
        const {shareOpen, reportOpen, isReported} = this.state;
        const to = `/m/${post.slug}${listType ? '?list=' + listType : ''}${(listType === 'user' && nickname) ? '&nickname=' + nickname : '' }`;
        return <article className={`post${ isReported ? ' post--reported' : ''}${!isList ? ' post--single' : ''}`} ref={(el) => {this.element = el}}>
            <PostAuthor post={post} />
            <PostHeader post={post} to={to} isList={isList} />
            <PostContent post={post} isList={isList} to={to}/>
            <PostMenu post={post} report={this.setReportOpen.bind(this, true)} />
            <PostFooter setShareOpen={this.setShareOpen.bind(this, true)} post={post} isList={isList} to={to}/>
            <PostShare post={post} open={shareOpen} close={this.setShareOpen.bind(this, false)}/>
            <PostReport post={post} open={reportOpen} closeReport={this.setIsReported.bind(this)} close={this.setReportOpen.bind(this, false)}/>
        </article>
    }
}


const mapStateToProps = (state, ownProps) => {
    return {
        listType: state.itemList.type,
        nickname: state.itemList.nickname,
        user: state.userData.user,
        screenHeight: state.screen.height,
        screenWidth: state.screen.width,
        screenHeight: state.screen.height,
        deleted: !!state.itemList.deletedItems.find((val) => { return val === ownProps.post.slug }),
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        deletePost: () => { dispatch(deletePost(ownProps.post.slug)) },
        openLoginModal: () => { dispatch(openLoginModal()); },
        registerView: () => { 
            if (ownProps.post && ownProps.post.slug) {
                dispatch(registerView(ownProps.post.slug));
            }
        },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Post);