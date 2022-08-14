import React from 'react';
import {connect} from 'react-redux';
import FAQ from './FAQ';

import LoginPage from '../LoginPage/LoginPage';
import {InfoLinks, LoginBlock} from '../shared';

import './styles/InfoPage.scss';

export function InfoPage({header, user}) {

    return <div id="about">
        <h2>{header}</h2>

        <FAQ />

        {!user && <LoginPage disableFaqLink={true}/>}

        <InfoLinks />

    </div>
}

const mapStateToProps = (state) => {
    return {
        header: state.localization.captions['aboutHeader'],
        user: state.userData.user,
    }
}

export default connect(mapStateToProps, null)(InfoPage);