import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import { parse } from 'qs';


import Loading from 'components/shared/Loading/Loading';
import PostContainer from 'components/Post/PostContainer';
import PostList from 'components/PostList/PostList';
import SideBanner from 'components/banners/SideBanner';
import Profile from '../../components/Profile/Profile';
import ProfileAuthorList from '../Profile/ProfileAuthorList';



export class ContentPage extends Component {

    _getListData() {
        const query = parse(this.props.location.search.substr(1));
        let listData = {

        }
        switch(this.props.location.pathname) {
            case '/':
                listData['listType'] = 'hot';
                break;
            case '/fresh':
                listData['listType'] = 'fresh';
                break;
            case '/best':
                listData['listType'] = 'best';
                break;
            case '/subscriptions':
                listData['listType'] = 'subscriptions';
                break;
        }
        if (this.props.match.params.nickname || (query.list === 'user' && query.nickname)) {
            listData.listType = 'user';
            listData.nickname = this.props.match.params.nickname || query.nickname;
        }

        if (!listData.listType) {
            listData.listType = query.list || 'hot';
        }
        return listData;

    }

    render() {
        const {displaySideBanner, match, isMobile} = this.props;
        let {slug, section} = match.params;
        const {listType, nickname} = this._getListData();
        if (nickname) {
            return [
                slug ? <PostContainer slug={slug} key="post" listType={listType} nickname={nickname} /> : null,
                (!slug && ['subscriptions', 'subscribers'].indexOf(section) !== -1) ? <ProfileAuthorList nickname={nickname} listType={section} key="author_list" /> : null,
                <Profile nickname={nickname} key="profile"/>,
            ]
        }

        return [
            slug ? <PostContainer slug={slug} key="post" listType={listType} /> : null,
            <PostList key="list" type={listType} />,
            displaySideBanner ? <SideBanner key="banner"/> : null,
        ];
    }
}

const mapStateToProps = (state) => {
    return {
        displaySideBanner: state.screen.width >= 960,
        isMobile: state.browser.isMobile,
        captions: state.localization.captions,
    }
}

export default connect(mapStateToProps, null)(ContentPage);

