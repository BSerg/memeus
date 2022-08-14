import React, {Component} from 'react';
import {Helmet} from 'react-helmet';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';
import io from 'socket.io-client';
import Menu from 'components/Menu/Menu';
import MenuButton from 'components/Menu/MenuButton';
import LoginModal from 'components/LoginPage/LoginModal';
import Notifications from 'components/Notifications/Notifications';
import MediaPreview from 'components/MediaPreview/MediaPreview';
import News from 'components/News/News';

import BanMessage from './BanMessage';

import {setScreenSize, registerVisitTick, getNews} from './actions';


import './styles/Base.scss';

export class Base extends Component {
    visitTickInterval;

    constructor() {
        super();
        try {
            this.state = {showBanMessage: !!window.__USER_BANNED__};
        } catch(err) {
            this.state = {showBanMessage: false};
        }
        
        this.closeBan = this.closeBan.bind(this);
    }

    closeBan() {
        this.setState({showBanMessage: false})
    }

    setScreenSize() {
        this.props.setScreenSize(window.innerWidth, window.innerHeight);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.wsConnected !== this.props.wsConnected) {
            if (nextProps.wsConnected) {
                this.visitTickInterval = setInterval(this.props.registerVisitTick, 30000);
            }
            else {
                clearInterval(this.visitTickInterval);
            }
        }
    }

    componentDidMount() {
        window.addEventListener('resize', this.setScreenSize.bind(this));
        let appServer = document.getElementById('app_server');
        if (appServer) {
            appServer.parentNode.removeChild(appServer);
        }
        this.props.getNews();
    }

    render() {
        let {children} = this.props;
        return <div id="container">
            <Helmet>
                <title>MEMEUS</title>
                <meta property="og:type" content="article"/>
                <meta property="og:title" content={'MEMEUS'}/>
                <meta property="og:url" content={'https://memeus.ru'}/>
                <meta property="og:description" content={'memeus description'}/>

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={'MEMEUS'} />
                <meta name="twitter:description" content={'memeus description'} />

            </Helmet>
            <MediaPreview />
            <Notifications />
            <LoginModal />
            <MenuButton />
            <Menu />
            <News />
            { this.state.showBanMessage && <BanMessage closeCallback={this.closeBan}/> }
            <div id="content">
                {children}
            </div>
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        wsConnected: state.userData.wsConnected
    }
}


const mapDispatchToProps = (dispatch) => {
    return {
        setScreenSize: (width, height) => { dispatch(setScreenSize(width, height)) },
        registerVisitTick: () => { dispatch(registerVisitTick()) },
        getNews: () => { dispatch(getNews()) },
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Base));