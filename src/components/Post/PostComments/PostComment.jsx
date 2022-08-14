import React, {PureComponent} from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import ReactSVG from 'react-svg';
import {formatDate} from 'utils/format';

import {openPreview, deleteComment} from './actions/actions';
import CloseIcon from './images/close_white.svg';

import './styles/PostComment.scss';

export const PostCommentDate = connect(
    (state) => {
        return {
            lang: state.localization.language
        }
    }, null
)(({d, lang}) => {
    let formattedDate = formatDate(d, lang);
    return <div className="post__comment_date">{formattedDate}</div>
});


export function PostMediaF({media, openPreview}) {
    if (!media || !media.length) {
        return null;
    }
    let previewPath;
    let defaultPath;
    try {
        previewPath = media[0].preview.path;
        defaultPath = media[0].default.path;
        if (!previewPath || !defaultPath) {
            return null;
        }
    } catch(err) {
        return null;
    }
    
    return <div className="post__comment_media">
        <div style={{ backgroundImage: `url("${previewPath}")` }} onClick={() => { openPreview(defaultPath) }} />
    </div>
}

const mapDispatchToPropsMedia = (dispatch) => {
    return {
        openPreview: (path) => { dispatch(openPreview(path)) }
    }
};

const PostMedia = connect(null, mapDispatchToPropsMedia)(PostMediaF);


export class PostComment extends PureComponent {
    element;
    constructor() {
        super();
        this.state = { deleted: false };
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.element.className += ' post__comment--deleted';
        setTimeout(() => {
            this.props.deleteComment();
            this.setState({deleted: true});
        }, 300)
    }

    render() {
        if (!this.props.item || this.state.deleted) {
            return null;
        }

        const {item} = this.props;
        const {user, text, media} = item;
        return <div className="post__comment" ref={(el) => this.element = el}>
            {user && user.avatar && <Link className="post__comment_author_avatar" to={`/u/${user.nickname}`}><img src={user.avatar.path} alt="" /></Link>}
            {user && <div className="post__comment_author"><Link to={`/u/${user.nickname}`}>{user.nickname}</Link> </div>}
            <div className="post__comment_text">
                {item.text}
            </div>
            <PostMedia media={item.media} />
            {item.isOwner && <div className="post__comment_delete" onClick={this.handleDelete}><ReactSVG path={CloseIcon}/></div>}
            <PostCommentDate d={item.createdAt} />
        </div>;

    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        deleteComment: () => { dispatch(deleteComment(ownProps.item)) }
    }
}

export default connect(null, mapDispatchToProps)(PostComment);