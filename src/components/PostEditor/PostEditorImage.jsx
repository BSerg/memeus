import React, {Component} from 'react';
import {connect} from 'react-redux';

import {processImageClient} from 'utils/processImageClient';

import {openPreview} from './actions';


import './styles/PostEditorImage.scss';


export class PostEditorImage extends Component {
    input;
    urlTimeout;
    element;

    constructor() {
        super();
        this.state = {media: [], previewIndex: -1, error: ""};
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDocumentDrop = this.onDocumentDrop.bind(this);
        this.handlePaste = this.handlePaste.bind(this);
    }

    handleClick() {
        if (!this.state.media.length) {
            this.input.click();
        }
        
    }

    _getMediaList(blob) {
        return [{blob, src: window.URL.createObjectURL(blob)}]
    }

    _processImage(objectUrl) {
        let canvas = document.createElement('canvas');
        processImageClient(canvas, objectUrl).then((blob) => {
            this.setState({media: this._getMediaList(blob), error: ""});
        }).catch((err) => { 
            this.setState({error: this.props.captions["imageErrorAspectRatio"], media: []});
        });
    }

    _processFile(file) {
        if (!file) {
            return;
        }
        if (file.size > 10000000) {
            this.setState({ error: this.props.captions["imageErrorSize"] });
            return;
        }
        let objectUrl = window.URL.createObjectURL(file);
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
            this._processImage(objectUrl);
        }
        else if (file.type === 'image/gif') {
            this.setState({media: this._getMediaList(file), error: ""});
        }
        
    }

    handleInputChange() {
        this._processFile(this.input.files[0]);
        this.input.value = '';
    }

    handleUrlChange() {
        let canvas = document.createElement('canvas');
        let url = this.props.url;
        processImageClient(canvas, url).then((blob) => {
            console.log(blob);
            // this.setState({media: this._getMediaList(blob), error: ""});
        }).catch((err) => { 
            console.log(err);
            // this.setState({error: this.props.captions["imageErrorAspectRatio"], media: []});
        });
    }

    removeImage(index, e) {
        e.stopPropagation();
        let media = [...this.state.media];
        media.splice(index, 1);
        this.setState({media, error: ""});
    }

    openPreview(index) {
        try {
            this.props.openPreview(this.state.media[index].src);
        } catch(err) {}
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.media !== prevState.media) {
            this.props.onChange && this.props.onChange(this.state.media.map((m) => { return m.blob }))
        }
        if (prevProps.url && !this.props.urs) {
            this.setState({media: []});
        }
        if (this.props.url && prevProps.url !== this.props.url ) {
            clearTimeout(this.urlTimeout);
            this.urlTimeout = setTimeout(this.handleUrlChange.bind(this), 500);
        }
    }

    onDocumentDrop(e) {
        e = e || event;
        e.preventDefault();
    }

    onDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        try {
            const file = evt.dataTransfer.files[0];
            this._processFile(evt.dataTransfer.files[0]);
        }
        catch(err) {

        }
    }

    handlePaste(e) {
        try {
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                let item = e.clipboardData.items[i];
                if (item.type === 'image/png') {
                    let objectUrl = window.URL.createObjectURL(item.getAsFile());
                    this._processImage(objectUrl);
                    break;
                }
            }
        }
        catch(err) {
            console.log(err);
        }
    }


    componentDidMount() {
        document.addEventListener('dragover', this.onDocumentDrop)
        document.addEventListener('drop', this.onDocumentDrop);
        window.addEventListener('dragover', this.onDocumentDrop);
        window.addEventListener('drop', this.onDocumentDrop);
        window.addEventListener('paste', this.handlePaste);
    }

    componentWillUnmount() {
        window.removeEventListener('paste', this.handlePaste);
    }

    render() {
        let {media, previewIndex, error} = this.state;
        let {disabled, captions} = this.props;
        let hint = captions["imageHint"];
        let previewSrc = media.length && media[previewIndex] && media[previewIndex].src;

        return [
            <div className="post_editor_image" key="main">
            {disabled && <div className="post_editor_image_disable"></div>}
            <div className={`post_editor_image__container${media.length ? ' post_editor_image__container--full' : ''}`} 
                 onClick={this.handleClick} 
                 onDrop={this.onDrop}>
                {
                    media.map((item, index) => {
                        return <div className="post_editor_image__item"
                                    onClick={this.openPreview.bind(this, index)}
                                    style={{background: `url(${item.src}) center center no-repeat`}}
                                    key={index}>
                            <div className="post_editor_image__item__delete" onClick={this.removeImage.bind(this, index)} />
                        </div>
                    })
                }
                
            </div>
            {!error && <div className="post_editor_image_hint">
                <p>{hint}</p>
                <p>{captions["editorImageRules"]}</p>
            </div>}
            {error && <div className="post_editor_image_hint post_editor_image_hint--error">{error}</div>}
            <input onChange={this.handleInputChange} type="file" accept="image/jpeg,image/png,image/gif" ref={(el) => {this.input = el}} />
        </div>]
    }
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        openPreview: (path) => { dispatch(openPreview(path)); }
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(PostEditorImage);