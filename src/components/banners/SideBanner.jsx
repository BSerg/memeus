import React, {Component} from 'react';
import {connect} from 'react-redux';

import {renewSideBanner} from './actions/bannerActions';

import './styles/banners.scss';

const FIXED_TOP = 70;
const RENEW_TIMEOUT = 10000;

export class SideBanner extends Component {

    element;
    isScrolling = false;
    renewTimeout;

    constructor() {
        super();
        this.setPosition = this.setPosition.bind(this);
        this.renewBanner = this.renewBanner.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.onIntervalScroll = this.onIntervalScroll.bind(this);
    }

    renewBanner() {
        this.props.renew();
    }

    setPosition() {
        try {
            const {top, height} = this.element.getBoundingClientRect();
            let elementTop = -window.pageYOffset + FIXED_TOP;
            const minTop = window.innerHeight - (height + 10);
            if (height + FIXED_TOP < window.innerHeight) {
                elementTop = FIXED_TOP;
            }
            else if (elementTop < minTop)  {
                elementTop = minTop;
            }
            this.element.style.top = `${ elementTop }px`;
        }
        catch(err) {

        }
        
    }

    loadBannerData() {
        if (this.props.disabled) {
            return;
        }
        let {banner} = this.props;
        if (!banner) {
            return;
        }
        try {
            let script = this.element.getElementsByTagName('script')[0];
            if (script) {
                let f = new Function(script.innerText);
                f();
                script.innerHtml = '';
            }
        } catch(err) {  }
        this.renewTimeout = setTimeout(this.renewBanner, RENEW_TIMEOUT);
        setTimeout(this.setPosition);
    }

    onScroll() {
        this.isScrolling = true;
    }

    onIntervalScroll() {
        if (!this.isScrolling) {
            return;
        }
        this.isScrolling = false;
        this.setPosition();
    }

    componentDidMount() {
        this.loadBannerData(this.props.banner);
        window.addEventListener('scroll', this.onScroll);
        this.scrollInterval = setInterval(this.onIntervalScroll, 100);
    }

    componentWillUnmount() {
        clearTimeout(this.renewTimeout);
        clearInterval(this.scrollInterval);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.banner !== this.props.banner || prevProps.disabled !== this.props.disabled) {
            this.loadBannerData();
        }
    }

    render() {
        let {disabled, banner, adCaption} = this.props;
        if (disabled)  {
            return null;
        }
        let style = { position: 'fixed', width: '300px', top: `${FIXED_TOP}px`, left: 'calc(50% + 155px)'};
        style.minHeight = banner ? `${banner.height}px` : '0';
        let html = banner ? banner.html : '';
        const containerStyle = {minHeight: '600px'};
        return <div className="ad" style={style} 
                ref={(el) => {this.element = el}} >
                    <div id="side_banner_1" dangerouslySetInnerHTML={{__html: html}} style={containerStyle}></div>
                    <div className="ad__caption">{adCaption}</div>
                </div>
    }
}

const mapStateToProps = (state) => {

    return {
        disabled: state.screen.width < 960,
        banner: state.bannerData.sideBanners[state.bannerData.currentSideBannerIndex],
        screenHeight: state.screen.height,
        adCaption: state.localization.captions["adCaption"],
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        renew: () => { dispatch(renewSideBanner()) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SideBanner);