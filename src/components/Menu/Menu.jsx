import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Link, NavLink} from 'react-router-dom';
import ReactSVG from 'react-svg';
import LoginBlock from 'components/shared/LoginBlock/LoginBlock';
import SettingsIcon from './images/settings.svg';
import CloseIcon from './images/close.svg';
import LogoutIcon from './images/logout.svg';
import InfoIcon from './images/info-icon.svg';
import Logo from './images/logo.svg';
import {toggleMenuOpen} from './actions';

import './styles/Menu.scss';


export function MenuClose({closeMenu}) {
    return <div onClick={closeMenu} className="menu__close">
        <ReactSVG path={CloseIcon}/>
    </div>
};

export function MenuLinks({closeMenu, captions, user}) {
    let MENU_LINKS = [
        {key: "trending", to: "/", caption: captions["menuLinkHot"]},
        {key: "hot", to: "/best", caption: captions["menuLinkBest"]},
        {key: "fresh", to: "/fresh", caption: captions["menuLinkFresh"]},
        process.env.SUBSCRIPTION_ENABLED && user ? {key: "subscriptions", to: "/subscriptions", caption: captions["menuLinkSubscriptions"]} : null,
        {key: "add", to: "/add", caption: captions["menuLinkAdd"]},
    ];

    return MENU_LINKS.map((linkData) => {
        if (!linkData) {
            return null;
        }
        let className = `menu__link${closeMenu ? '' : ' menu__link_desktop' }`;
        return <NavLink exact className={className} key={linkData.key} to={linkData.to} onClick={closeMenu} >
            {linkData.caption}
        </NavLink>
    });
};

const mapStateToPropsMenuLinks = (state) => {
    return {
        captions: state.localization.captions,
        user: state.userData.user,
    }
};

const MenuLinksConnected = withRouter(connect(mapStateToPropsMenuLinks, null)(MenuLinks));

export function MenuControls({closeMenu}) {
    return <div className="menu__controls">
        <NavLink className="menu__icon_link" key="about_link" to="/about" onClick={closeMenu}>
            <ReactSVG path={InfoIcon}/>
        </NavLink>
    
        <NavLink to="/manage" onClick={closeMenu}><ReactSVG path={SettingsIcon}/></NavLink>
        <a href="/logout"><ReactSVG path={LogoutIcon}/></a>
    </div>
};

export function MenuDisplay({title, image, link}) {
    return <div className="menu__display">
        {image && <img src={image} />}
        <div>{title}</div>
    </div>
};

export function MenuContentUserMobile({closeMenu, user}) {
    return [
        <div key="header" className="menu__header">
            <MenuControls key="controls" closeMenu={closeMenu} />
        </div>,
        <MenuLinksConnected key="links" closeMenu={closeMenu} />,
    ]
};

export function MenuContentDefaultMobile({closeMenu}) {
    return [
        <div key="header" className="menu__header">
            <MenuDisplay title={'MEMEUS'} link={'/'}/>
            <NavLink className="menu__icon_link unauthorized lnk" key="about_link" to="/about" onClick={closeMenu}>
                <ReactSVG path={InfoIcon}/>
            </NavLink>,
        </div>,
        <LoginBlock key="loginBlock" className="menu__login_block" />,
        <MenuLinksConnected key="links" closeMenu={closeMenu} />
    ]
};

export function MenuLogo() {
    return <div className="menu__logo">
        <ReactSVG path={Logo}/>
    </div>
};

export function MenuContentUserDesktop() {
    return [
        <MenuLogo key="logo"/>,
        <MenuLinksConnected key="links" />,
        <MenuControls key="controls"/>
    ];
};

export function MenuAuthorize({captions}) {
    return <div key="loginBlock" className="menu__authorization">
        <div className="menu__authorization_caption">{captions["menuLogin"]}</div>
        <LoginBlock className="menu__login_block" />
    </div>
};

const mapStateToPropsAuthorize = (state) => {
    return {
        captions: state.localization.captions,
    }
};

const MenuAuthorizeConnected = connect(mapStateToPropsAuthorize, null)(MenuAuthorize);


export function MenuContentDefaultDesktop() {
    return [
        <MenuLogo key="logo"/>,
        <MenuLinksConnected key="links" />,
        
        <NavLink className="menu__icon_link" key="about_link" to="/about">
            <ReactSVG path={InfoIcon}/>
        </NavLink>,
        <MenuAuthorizeConnected key="auth" />
    ]
};


export class Menu extends Component {

    stopClosePropagation(e) {
        e.stopPropagation();
    }

    render() {
        let {user, isDesktop, open, closeMenu} = this.props;
        let MenuContent;
        if (isDesktop) {
            MenuContent = user ? <MenuContentUserDesktop /> : <MenuContentDefaultDesktop />;
        }
        else {
            MenuContent = user ? <MenuContentUserMobile closeMenu={closeMenu} user={user} /> : <MenuContentDefaultMobile closeMenu={closeMenu} />;
        }
        let className = isDesktop ? "" : (open ? "" : "hidden");
        return <div id="menu" className={className} onClick={closeMenu}>
            <div id="menu_content" onClick={this.stopClosePropagation}>
                {MenuContent}
                {!isDesktop && <MenuClose closeMenu={closeMenu}/>}
            </div>
        </div>;
    }
};

const mapStateToProps = (state) => {
    return {
        open: state.menu.open,
        isDesktop: state.screen.isDesktop,
        user: state.userData.user,
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        closeMenu: () => { dispatch(toggleMenuOpen(false)) }
    }
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Menu));