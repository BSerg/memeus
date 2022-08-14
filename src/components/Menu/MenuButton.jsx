import React, {Component} from 'react';
import {connect} from 'react-redux';
import {toggleMenuOpen} from './actions';
import ReactSVG from 'react-svg';
import Logo from './images/logo.svg';

import './styles/MenuButton.scss';


export class MenuButton extends Component {

    prevScrollTop = 0;
    scrollInterval;
    isScrolling;

    constructor() {
        super();
        this.state = {display: true};
        this.scrollHandler = this.scrollHandler.bind(this);
        this.scrollIntervalHandler = this.scrollIntervalHandler.bind(this);
    }

    scrollHandler() {
        this.isScrolling = true;
    }

    scrollIntervalHandler() {
        if (!this.isScrolling) {
            return;
        }

        this.isScrolling = false;
        let scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        this.setState({display: scrollTop - this.prevScrollTop <= 0 || scrollTop < 50});
        this.prevScrollTop = scrollTop;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.scrollHandler);
        setInterval(this.scrollIntervalHandler, 200);
    }

    render() {
        let {menuOpen, isDesktop, openMenu} = this.props
        let className = !menuOpen && !isDesktop && this.state.display ? 'visible' : '';
        return <div id="menu_button" className={className} onClick={openMenu}>
            <ReactSVG path={Logo}/>
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        menuOpen: state.menu.open,
        isDesktop: state.screen.isDesktop,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        openMenu: () => { dispatch(toggleMenuOpen(true)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuButton);