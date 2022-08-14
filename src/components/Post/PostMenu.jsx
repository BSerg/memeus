import React, {Component} from 'react';
import ReactSVG from 'react-svg';
import {connect} from 'react-redux';
import ParamsIcon from './images/params.svg';

import {openLoginModal, deletePost} from './actions/actions';

import './styles/PostMenu.scss';

export class PostMenu extends Component {

    constructor() {
        super();
        this.state = {open: false};
    }

    render() {
        let {post, report, captions, deletePost} = this.props;
        return <div className="post__menu">
            <div className="post__menu_button">
                <ReactSVG path={ParamsIcon}/>
            </div>
            <div className="post__menu_items">
                {!post.isOwner && <div onClick={report}>{captions["postReport"]}</div>}
                {post.isOwner && <div onClick={deletePost}>{captions["postDelete"]}</div>}
            </div>
        </div>
    }   
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions
    }
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        deletePost: () => { dispatch(deletePost(ownProps.post.slug)) },
        openLoginModal: () => { dispatch(openLoginModal()); },
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(PostMenu);