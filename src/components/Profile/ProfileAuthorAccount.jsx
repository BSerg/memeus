import React, {Component} from 'react';
import {connect} from 'react-redux';
import {ProfileAvatar, ProfileAvatarSimple, ProfileSubscription} from './ProfileInfo';

import './styles/ProfileAuthorAccount.scss';


export function ProfileAuthorAccount({author, editable, showSubscriptionInfo, match, postCountCaption})  {
    
    return <div className="profile_account">
        <div>
            {editable ? <ProfileAvatar avatar={author.avatar} editable={editable}/> : <ProfileAvatarSimple avatar={author.avatar}/>}
            <span className="profile_nickname">{author.nickname}</span>

            <span className="profile_post_count">{postCountCaption}: <strong>{author.posts}</strong></span>
            {process.env.SUBSCRIPTION_ENABLED && showSubscriptionInfo && <ProfileSubscription author={author} />}
        </div>
    </div>
}

const mapStateToProps = (state) => {
    return {
        postCountCaption: state.localization.captions['authorMemes'],
    }
}

export default connect(mapStateToProps, null)(ProfileAuthorAccount);