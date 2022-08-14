import React, {Component, PureComponent} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import './styles/banners.scss';


export class ContentBanner extends PureComponent {
    element;
    isScrolling;
    scrollInterval;

    static propTypes = {
        index: PropTypes.number.isRequired
    }

    static defaultProps = {
        idPrefix: ''
    }

    constructor() {
        super();
        this.state = { visible: false };
        this.onScroll = this.onScroll.bind(this);
        this.onIntervalScroll = this.onIntervalScroll.bind(this);
    }

    loadBannerData() {
        try {
            let script = this.element.getElementsByTagName('script')[0];
            if (script) {
                let f = new Function(script.innerText);
                f();
            }
        } catch(err) {
            // console.log(err);
        }
    }

    clearDOMData() {
    }

    checkVisibility() {
        const {top, bottom} = this.element.getBoundingClientRect();
        const visible = top <= window.innerHeight + 1000 && bottom > - 1000;
        if (this.state.visible !== visible) {
            this.setState({visible});
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
        if (this.state.visible && !prevState.visible) {
            this.loadBannerData();
        }
        else if (!this.state.visible && prevState.visible) {
            this.clearDOMData();
        }
    }

    componentDidMount() {
        if (!this.props.item) {
            return;
        }
        // window.addEventListener('scroll', this.onScroll);
        // this.checkVisibility();
        this.scrollInterval = setInterval(this.onIntervalScroll, 200);
    }

    componentWillUnmount() {
        // window.removeEventListener('scroll', this.onScroll);
        clearInterval(this.scrollInterval);
    }

    render() {
        let {item, bannerIndex, idPrefix, adCaption} = this.props;

        if (!item) {
            return null;
        }
        // const style = {width: `${item.width}px`, minHeight: `${item.height}px`, height: `${item.height}px`};
        const style = {};
        const html = item.html || '';
        return <div id={ this.state.visible ? `ad_${idPrefix}_${bannerIndex}_${item.width}_${item.height}` : undefined} 
                    ref={(el) => {this.element = el}} 
                    className="ad_content" 
                    style={style} >
                        <div dangerouslySetInnerHTML={{__html: html}}/>
                        <div className="ad__caption">{adCaption}</div>
                    </div>;
    }
}

const mapStateToProps = (state, ownProps) => {
    let item, bannerIndex;
    if (state.bannerData.contentBanners.length) {
        bannerIndex = (ownProps.index >= 0 ? ownProps.index : 0) % state.bannerData.contentBanners.length;
        item = state.bannerData.contentBanners[bannerIndex];
    }
    else {
        item = null;
    }

    return { item, bannerIndex, adCaption: state.localization.captions["adCaption"] }
}

export default connect(mapStateToProps, null)(ContentBanner);