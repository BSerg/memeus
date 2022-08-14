import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {Loading} from 'components/shared';
import Post from 'components/Post/Post';
import ContentBanner from 'components/banners/ContentBanner';
import {getPosts, changeListType, clear} from './actions';
import {BannerSettings} from 'utils/constants';



import './styles/PostList.scss';

const bannerFrequency = BannerSettings.CONTENT_BANNER_FREQUENCY || 1;

export class PostList extends Component {
    isScrolling;
    scrollInterval;
    div;

    static propTypes = {
        items: PropTypes.array.isRequired,
        loading: PropTypes.bool,
        adsEnabled: PropTypes.bool,
        type: PropTypes.string,
    };

    static defaultProps = {
        adsEnabled: true,
        type: 'trending'
    };

    constructor() {
        super();
        this.onScroll = this.onScroll.bind(this);
        this.onIntervalScroll = this.onIntervalScroll.bind(this);
        this.state = {bannerStartingIndex: Math.floor(Math.random() * 5)};
    }

    getHeader() {
        if (this.props.header) {
            return this.props.header;
        }
        switch(this.props.type) {
            case 'hot':
                return this.props.captions['menuLinkHot'];
            case 'subscriptions':
                return this.props.captions['menuLinkSubscriptions'];
            case 'fresh':
                return this.props.captions['menuLinkFresh'];
            case 'best':
                return this.props.captions['menuLinkBest'];
        }
        return null
    }

    onScroll() {
        this.isScrolling = true;
    }

    onIntervalScroll() {
        if (!this.isScrolling) {
            return;
        }
        this.checkBottom();
        this.isScrolling = false;
    }

    checkBottom() {
        if (this.props.loading || !this.props.hasMore) {
            return;
        }
        let {bottom} = this.div.getBoundingClientRect();
        if (bottom <= window.innerHeight + 300) {
            this.props.getPosts();
        }
    }

    componentDidMount() {
        this.props.getPosts();
        window.addEventListener('scroll', this.onScroll);
        this.scrollInterval = setInterval(this.onIntervalScroll, 300);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.items.length !== this.props.items.length) {
            this.checkBottom();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.type !== this.props.type) {
            this.props.changeListType(nextProps.type, nextProps.niclname);
        }
    }

    componentWillUnmount() {
        this.props.clear();
        window.removeEventListener('scroll', this.onScroll);
        window.clearInterval(this.onIntervalScroll);
    }

    render() {
        const {items, loading, adsEnabled, showHeader, } = this.props;
        const {bannerStartingIndex} =  this.state;
        const header = showHeader ? this.getHeader() : null;
        return <div className="post_list" ref={(el) => {this.div = el}}>
            {header && <h1>{header}</h1>}
            {
                items.map((item, index) => {
                    if (adsEnabled && (index + 1) % bannerFrequency  === 0) {
                        // console.log(bannerFrequency, bannerStartingIndex, index, (bannerStartingIndex + ((index + 1) / bannerFrequency) - 1));
                        return [
                            item ? <Post key={item.slug} post={item} isList={true} /> : null,
                            <ContentBanner key={`banner${index}`} index={bannerStartingIndex + ((index + 1) / bannerFrequency)} />
                        ]
                    }
                    return item ? <Post key={item.slug} post={item} isList={true} /> : null;
                })
            }
            { loading && <Loading /> }
        </div>
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        items: state.itemList.items,
        hasMore: state.itemList.hasMore,
        loading: state.itemList.loading,
        showHeader: ownProps.showHeader || (state.screen.width < 768 && ownProps.type !== 'my'),
        captions: state.localization.captions
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getPosts: () => { dispatch(getPosts(ownProps.type, ownProps.nickname)) },
        changeListType: (listType) => {dispatch(changeListType(listType))},
        clear: () => { dispatch(clear()) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostList);