import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import {Loading, ModalContainer} from 'components/shared';

import {getSubscriptionItems, reset} from './actions/authorActions';

import './styles/ProfileAuthorList.scss';

const ProfileAuthorListItem = ({item, memeCaption}) => {
    return <Link to={`/u/${item.nickname}`} className="author_item">
        {item.avatar && item.avatar.path && <img src={item.avatar.path}/>}
        {item.nickname}
        <span>{memeCaption}: {item.posts || 0}</span>
    </Link>
};


export class ProfileAuthorList extends Component {

    constructor() {
        super();
        this._getItems = this._getItems.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nickname !== this.props.nickname || nextProps.listType !== this.props.listType) {
            this.props.reset();
            setTimeout(() => { this.props.getItems(nextProps.nickname, nextProps.listType); }, 0);
        }
    }

    _getItems() {
        this.props.getItems(this.props.nickname, this.props.listType);
    }

    componentDidMount() {
        this.props.getItems(this.props.nickname, this.props.listType);
    }

    componentWillUnmount() {
        this.props.reset();
    }

    _getTitle() {
        switch(this.props.listType) {
            case 'subscriptions':
                return `${this.props.captions.authorSubscriptionsOf} ${this.props.nickname}`;
            case 'subscribers':
                return `${this.props.captions.authorSubscribedTo} ${this.props.nickname}`;
            default:
                return '';
        }
    }

    render() {
        const {items, nickname, listType, hasMore, loading, captions} = this.props;
        const title = this._getTitle();
        return <ModalContainer className="author_list" closeHref={`/u/${nickname}`}>
            <h3>{title}</h3>
            {items.map((item) => { return <ProfileAuthorListItem key={item.nickname} item={item} memeCaption={captions['authorMemes']} /> })}

            {loading && <Loading />}
            {hasMore && !loading && <div className="author_list__more" onClick={this._getItems}>{captions['authorListMore']}</div>}
            {!loading && !hasMore && !items.length && <div className="author_list__empty">{captions['authorListEmpty']}</div>}
        </ModalContainer>
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        items: state.authorData.related,
        hasMore: state.authorData.relatedHasMore,
        loading: state.authorData.relatedLoading,
        captions: state.localization.captions,
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getItems: (nickname, listType) => { dispatch(getSubscriptionItems(nickname, listType)) },
        reset: () => { dispatch(reset()) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProfileAuthorList);