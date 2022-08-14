import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import ReactSVG from 'react-svg';

import {toggleSubscription} from '../actions/authorActions';

import ConfirmIcon from './images/confirm.svg';
import CloseIcon from './images/close.svg';

import './styles/ProfileSubscription.scss';


export const  ProfileSubscriptionButton  = connect(
    null,
    (dispatch) => {
        return {
            toggleSubscription: () => { dispatch(toggleSubscription()) }
        }
    }

)(({captions, isSubscribed, toggleSubscription}) => {
    if (isSubscribed) {
        return <div className="profile_subscription__button" onClick={toggleSubscription}>
            <span className="profile_subscription__button--default">
                <ReactSVG path={ConfirmIcon}/>
                {captions["authorIsSubscribed"]}
            </span>
            <span className="profile_subscription__button--hover">
                <ReactSVG path={CloseIcon}/>
                {captions["authorUnsubscribe"]}
            </span>
        </div>
    }
    return <div className="profile_subscription__button" onClick={toggleSubscription}>
        {captions["authorSubscribe"]}
    </div>
})


export function ProfileSubscription({author, captions}) {
    if (!author) {
        return null
    }
    const {isSubscribed, subscriptions, subscribers, isSelf} = author;

    const buttonText = author.isSubscribed ? captions["authorUnsubscribe"] : captions["authorSubscribe"];

    return <div className="profile_subscription">
        <div className="profile_subscription__links">
            <Link className="profile_subscription__link" to={`/u/${author.nickname}/subscriptions`}>
                {captions["authorSubscriptions"]}<span>{subscriptions || 0}</span>
            </Link>
            <Link className="profile_subscription__link" to={`/u/${author.nickname}/subscribers`}>
                {captions["authorSubscribers"]}<span>{subscribers || 0}</span>
            </Link>
        </div>
        {!isSelf && <ProfileSubscriptionButton captions={captions} isSubscribed={isSubscribed} />}
    </div>
    
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
    }
}


export default connect(mapStateToProps, null)(ProfileSubscription);