import React, {Component} from 'react';
import {connect} from 'react-redux';

import ProfileAuthorAccount from './ProfileAuthorAccount';
import {Loading} from '../shared';
import {Error404} from '../Error/Error';
import {getAuthor} from './actions/authorActions';

import PostList from '../PostList/PostList';

export class Profile extends Component {

    componentDidMount() {
        this.props.getAuthor(this.props.nickname);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nickname !== this.props.nickname) {
            this.props.getAuthor(nextProps.nickname);
        }
    }

    render() {
        const {item, loading, error, nickname} = this.props;
        if (loading) {
            return <Loading />;
        }
        if (error) {
            return <Error404 />
        }
        if (!item) {
            return null;
        }
        return <div className="profile">
            <ProfileAuthorAccount author={item} editable={false} showSubscriptionInfo={true}/>
            <div className="profile_data">
                <PostList type='user' nickname={nickname}/>
            </div>
            
        </div>
    }
}


const mapStateToProps = (state) => {
    return {
        ...state.authorData
    }
}

const mapDispatchToProps = (dispatch) => {

    return {
        getAuthor: (nickname) => { dispatch(getAuthor(nickname)) } 
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Profile);