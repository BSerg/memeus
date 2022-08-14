import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';

export class PostContentVideo extends Component {
    element;
    isScrolling;
    scrollInterval;

    constructor(props) {
        super(props);
        this.state = {isPlaying: !props.isList};
        this.checkVisibility = this.checkVisibility.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.onIntervalScroll = this.onIntervalScroll.bind(this);
        this.play = this.play.bind(this);
    }

    play() {
        try {
            this.element.play();
        } catch(err) {}
    }

    checkVisibility() {
        const {top, bottom} = this.element.getBoundingClientRect();
        const isPlaying = top < (window.innerHeight - 100) && bottom > 100;

        if (isPlaying !== this.state.isPlaying) {
            this.setState({isPlaying});
        }
    }

    onScroll() {
        this.isScrolling = true;
    }

    onIntervalScroll() {
        if (!this.isScrolling) {
            return;
        }
        this.isScrolling = false;
        this.checkVisibility();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.isPlaying && !prevState.isPlaying) {
            
            try {
                this.element.play().then(() => {}).catch(() => {});
            } catch(err) { console.log(err) }
        }
        else {
            try {
                this.element.currentTime = 0;
                this.element.pause().then(() => {}).catch(() => {});
            } catch(err) {}
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.isPlaying !== nextState.isPlaying;
    }

    componentDidMount() {
        if (!this.props.isList) {
            try {
                this.element.play().then(() => {}).catch(() => {});;
            }
            catch(err) {}
        }
        else if (this.props.isList && !this.props.isMobile) {
            this.checkVisibility();
            window.addEventListener('scroll', this.onScroll);
            this.scrollInterval = setInterval(this.onIntervalScroll, 300);
        }
        
    }

    componentWillUnmount() {
        clearInterval(this.scrollInterval);
        window.removeEventListener('scroll', this.onScroll);
    }


    render() {
        let {media, isMobile, isList} = this.props;
        let {isPlaying} = this.state;
        const className = isPlaying ? "" : "post__video--preview";
        return <div className={className}>
            <video ref={(el) => {this.element = el}} style={{width: '100%'}} 
                      poster={media.preview.path} autoPlay={!isList && isPlaying} 
                      loop={true} playsInline={true}>
                <source src={media.default.path} type="video/mp4" />
            </video>
        </div>
    }
}

export class PostContentVideoMobile extends Component {
    element;

    constructor(props) {
        super(props);
        this.state = {isPlaying: false};
        this.togglePlay = this.togglePlay.bind(this);
        this.onScroll = this.onScroll.bind(this);
    }

    togglePlay() {
        this.setState({isPlaying: !this.state.isPlaying}, () => {
            
            try {
                if (this.state.isPlaying) {
                    this.element.play().then(() => {}).catch((err) => { console.log(err) });
                }
                else {
                    this.element.currentTime = 0;
                    this.element.pause().then(() => {}).catch(() => {});
                }
                
            } catch(err) {}
        });
    }

    onScroll() {
        if (this.state.isPlaying) {
            this.togglePlay();
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.onScroll);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.onScroll);
    }

    render() {
        let {media, isList} = this.props;
        let {isPlaying} = this.state;

        return <div className={isPlaying ? "" : "post__video--preview"} onClick={this.togglePlay}>
            <video ref={(el) => {this.element = el}} style={{width: '100%'}} 
                      onClick={this.play}
                      poster={media.preview.path} autoPlay={!isList && isPlaying} loop={isPlaying} playsInline={true}>
                <source src={media.default.path} type="video/mp4" />
            </video>
        </div>

    }
}