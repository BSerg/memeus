import React, {Component} from 'react';
import {connect} from 'react-redux';

import ProfileManagementBalance from './ProfileManagementBalance';
import ProfileManagementTransactions from './ProfileManagementTransactions';
import ProfileManagementTokenWithdraw from './ProfileManagementTokenWithdraw';

import './styles/ProfilePayments.scss';


export function ProfileManagementPayments() {
    
    
    return <div>
        <ProfileManagementTokenWithdraw />
        <ProfileManagementBalance />
        <ProfileManagementTransactions />
    </div>

}


export default ProfileManagementPayments;