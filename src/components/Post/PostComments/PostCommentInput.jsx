import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactSVG from 'react-svg';

import {ContentEditable} from '../../shared';

import {sendComment} from './actions/actions';
import {processImageClient} from 'utils/processImageClient';

import PostCommentInputPreview from './PostCommentInputPreview';
import './styles/PostCommentsInput.scss';

import ImageIcon from './images/image.svg';

const MAX_COMMENT_LENGTH = 280;

export class PostCommentInput extends Component {

    fileInput;

    constructor() {
        super();

        this.state = { text: '', media: []};
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleCleareMediaClick = this.handleCleareMediaClick.bind(this);
        this.handleMediaInputChange = this.handleMediaInputChange.bind(this);
    }

    handleClick() {
        if (!this.state.media || !this.state.media.length) {
            this.fileInput.click();
        }
    }

    handleCleareMediaClick() {
        this.setState({media: []});
    }

    handleChange(e) {
        const text = e.target.value
        this.setState({text: text.substr(0, 280)});
    }

    handleMediaInputChange(e) {
        const file = e.target.files[0];
        if (!file) {
            return null;
        }
        let objectUrl = window.URL.createObjectURL(file);
        let canvas = document.createElement('canvas');
        processImageClient(canvas, objectUrl).then((blob) => {
            this.setState({media: [blob]});
        }).catch((err) => { 
            this.setState({media: []});
        });
        this.fileInput.value = '';
        // this.setState({media: [file]});
    }

    handleKeyDown(e) {
        
        if(e.keyCode == 13 && e.shiftKey == false) {
            e.preventDefault();
            this._submit()
        }
    }

    handleSubmit(e) {

        e.preventDefault();
        this._submit();
        
    }

    _submit() {
        if (!this.state.text && !this.state.media.length) {
            return;
        }
        this.setState({text: '', media: []});
        this.props.send(this.state.text, this.state.media);
    }

    render() {

        const {text, media, } = this.state;
        const {captions, uploading} = this.props;
        const disabled = !text && (!media || !media.length);
        return <div className="post__comments_input">
            { uploading && <div className="post__comments__comment_uploading"></div> }
            <form onSubmit={this.handleSubmit}>
                <span>{captions["commentsSay"]}</span>
                <textarea className="post__comments_input__input_box" value={text} 
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}/>
                <div className="post__comment_input__bottom">
                    { media && !!media.length && 
                        <div className="post__comment_input__media_preview">
                        <PostCommentInputPreview media={media}/>
                        <span onClick={this.handleCleareMediaClick}>{captions["commentsRemoveMedia"]}</span>
                    </div> }
                    {!media.length && <div onClick={this.handleClick} className="post__comments_input__image_button"><ReactSVG path={ImageIcon}/></div>}
                    <input ref={(el) => { this.fileInput = el; }} onChange={this.handleMediaInputChange} type="file" accept="image/jpeg,image/png,image/gif" />
                    <input type="submit" value={captions["commentsSend"]} disabled={disabled}/>
                </div>
            </form>
        </div>;
    }
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
        uploading: state.postData.commentUploading,
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        send: (text, media) => { dispatch(sendComment(text, media)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostCommentInput);