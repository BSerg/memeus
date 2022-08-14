import React, {Component} from 'react';
import {connect} from 'react-redux';
import {NavMenu, InfoLinks} from 'components/shared';
import ProfileAuthorAccount from './ProfileAuthorAccount';
import ProfileManagementAccount from './ProfileManagementAccount';
import ProfileManagementPosts from './ProfileManagementPosts';
import ProfileManagementPayments from './ProfileManagementPayments/ProfileManagementPayments'
import {Error404} from 'components/Error/Error';
import LoginPage from 'components/LoginPage/LoginPage';
import {Loading} from 'components/shared';

import {getMe} from './actions/userActions';


import './styles/Profile.scss';

const dataComponents = {
    default: ProfileManagementAccount,
    posts: ProfileManagementPosts,
    payments: ProfileManagementPayments
}


export class ProfileManagement extends Component {

    componentDidMount() {
        if (!this.props.fullData) {
            this.props.getMe();
        }
        
    }

    render() {
        let {user, loading, error, menuItems, match} = this.props;
        if (!user) {
            return <LoginPage />
        }
        if (loading) {
            return <Loading />
        }
        let DataComponent = dataComponents[match.params.slug || 'default'];
        return <div className="profile">
            <ProfileAuthorAccount author={user} editable={true}/>
            <div className="profile_data">
                <NavMenu items={menuItems}/>
                {DataComponent && <DataComponent />}

                <InfoLinks />
            </div>
        </div>
    }
    
}

const mapStateToProps = (state, ownProps) => {
    let menuItems = [
        {key: 'main', to: '/manage', label: state.localization.captions['manageMenuAccount']},
        {key: 'posts', to: '/manage/posts', label: state.localization.captions['manageMenuPosts']},
        {key: 'payments', to: '/manage/payments', label: state.localization.captions['manageMenuPayments']},
    ]

    return {
        user: state.userData.user,
        loading: state.userData.loading,
        fullData: state.userData.fullData,
        error: state.userData.error,
        menuItems
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        getMe: () => { dispatch(getMe()) }
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileManagement);