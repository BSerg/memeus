import React, {Component} from 'react';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';

import PostEditorImage from './PostEditorImage';
import PostEditorProgress from './PostEditorProgress';
import {ReCaptcha} from 'components/shared';
import {createPost, setDefault} from './actions';

import PostEditorDisabled from './PostEditorDisabled';

import LoginPage from 'components/LoginPage/LoginPage';

import './styles/PostEditor';

const isCaptchaDisabled = () => {
    try {
        return !!window.__CAPTCHA_DISABLED__;
    } catch(err) {
        return false;
    }
};


export class PostEditor extends Component {

    constructor() {
        super();
        this.state = { caption: '', captchaResponse: null, media: [], 
            url: '', urlCorrect: true, disableCaptcha: isCaptchaDisabled()};
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCaptionChange = this.handleCaptionChange.bind(this);
        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.onVerifyCaptcha = this.onVerifyCaptcha.bind(this);
        this.onExpireCaptcha = this.onExpireCaptcha.bind(this);
        this.onChangeMedia = this.onChangeMedia.bind(this);
    }

    _checkUrl(url) {
        return /^(https?:\/\/.*\.(?:png|jpe?g|gif))$/.test(url);
    }

    isReady() {
        if (this.state.disableCaptcha) {
            return !!this.state.media.length;
        }
        return (this.state.media.length || this.state.url) && this.state.urlCorrect && !!this.state.captchaResponse;
    }

    handleCaptionChange(e) {
        let val = e.target.value;
        if (val.length <= 255) {
            this.setState({caption: val});
        }
    }

    handleUrlChange(e) {
        let val = e.target.value;
        this.setState({url: val, urlCorrect: !val || this._checkUrl(val)});
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.isReady()) {
            return;
        }

        this.props.create(this.state.caption, this.state.media, this.state.captchaResponse, this.state.url);
    }

    

    onChangeMedia(media) {
        this.setState({media: [...media]})
    }

    onVerifyCaptcha(r) {
        this.setState({captchaResponse: r});
    }

    onExpireCaptcha(r) {
        this.setState({captchaResponse: null});
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.newPost && nextProps.newPost) {
            this.props.history.push(`/m/${nextProps.newPost.slug}?list=fresh`);
        }
    }

    componentDidMount() {
        this.props.setDefault();
    }

    componentWillUnmount() {
        this.props.setDefault();
    }

    render() {

        if (process.env.EDITOR_DISABLED) {
            return <PostEditorDisabled />;
        }

        let {user, captions, progress, uploading, error} = this.props;
        let {caption, media, url, captchaResponse, urlCorrect, disableCaptcha} = this.state;
        if (!user) {
            return <LoginPage />;
        }
        let loadByUrl = false;
        let ready = this.isReady();
        let hideCaptcha = !media.length && (!url || !urlCorrect);
        return <div id="post_editor">
            <PostEditorProgress progress={progress} uploading={uploading} error={error} />
            
            <form method="post" onSubmit={this.handleSubmit}>
                <input type="text" name="caption" placeholder={captions["imageCaption"]}
                        value={caption} onChange={this.handleCaptionChange} />
                <PostEditorImage onChange={this.onChangeMedia} url={urlCorrect ? url : null} />
                {loadByUrl && 
                    <input type="text" className={urlCorrect ? "" : "url_error"} 
                           name="url" value={url} placeholder={captions["imageUrl"]} 
                           onChange={this.handleUrlChange}/>
                }
                {!disableCaptcha && <ReCaptcha elementID={'post_captcha'}
                           hidden={hideCaptcha}
                           expiredCallback={this.onExpireCaptcha}
                           verifyCallback={this.onVerifyCaptcha} />}
                <button type="submit" className={ready ? "" : "disabled"} disabled={!ready}>{captions["imagePublish"]}</button>
            </form>
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.userData.user,
        captions: state.localization.captions,
        newPost: state.editor.newPost,
        progress: state.editor.progress,
        uploading: state.editor.uploading,
        error: state.editor.error,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        create: (caption, media, captchaResponse, url) => { dispatch(createPost(caption, media, captchaResponse, url)); },
        setDefault: () => { dispatch(setDefault()); }
    }   
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PostEditor));