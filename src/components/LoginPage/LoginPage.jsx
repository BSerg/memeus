import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';

import {closeModal} from './actions';

import LoginBlock from 'components/shared/LoginBlock/LoginBlock';

import './styles/LoginPage.scss';

export function LoginPage({header, headerLoggedIn, logoutCaption, loggedIn, whatIsCaption, disableFaqLink, close})  {
    if (loggedIn) {
        return <div className="login_page">
            <h1>{headerLoggedIn}</h1>
            <div className="login_page__link_container"><a href="/logout">{logoutCaption}</a></div>
        </div>
    }
    return <div className="login_page">
        <h1>{header}</h1>
        <LoginBlock />
        { !disableFaqLink && <Link to="/about" className="login_page__faq_link" onClick={close}>{whatIsCaption}</Link> }
    </div>

}

const mapStatToProps = (state) => {
    return {
        header: state.localization.captions["signupFast"],
        headerLoggedIn: state.localization.captions["alreadyLoggedIn"],
        logoutCaption: state.localization.captions["logout"],
        loggedIn: !!state.userData.user,
        whatIsCaption: state.localization.captions["whatIs"],
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        close: () => { dispatch(closeModal()); }
    }
};



export default connect(mapStatToProps, mapDispatchToProps)(LoginPage);