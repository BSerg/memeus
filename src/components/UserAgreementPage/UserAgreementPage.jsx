import React, {Component} from 'react';
import {connect} from 'react-redux';

import {InfoLinks} from '../shared';
import {getHtml} from './actions/actions';

import './styles/UserAgreementPage.scss';

export class UserAgreementPage extends Component {

    textContainer;
    headers;

    constructor(props) {
        super(props);
        this.state = { menuItems: [], html: '' }
    }


    _getHtml() {
        this.props.getHtml();
    }
    

    _generateMenu() {
        try {
            let headers = this.textContainer.getElementsByTagName('h2');
            this.headers = headers;
            let menuItems = [];
            for(let i = 0; i < headers.length; i++) {
                menuItems.push(headers[i].innerText);
            }
            this.setState({menuItems});
        } catch(err) {
        }
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.props.getHtml(nextProps.location.pathname.substr(1));
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.html !== this.props.html) {
            this._generateMenu();
        }
    }

    scrollTo(index) {
        
        try {
            window.scrollTo(0, this.headers[index].offsetTop - this.headers[index].getBoundingClientRect().height - 30);
        } catch(err) {  }
    }

    componentDidMount() {
        this.props.getHtml(this.props.location.pathname.substr(1));
        this._generateMenu();
    }


    render() {
        const {menuItems} = this.state;
        const {html} = this.props;
        return <div className="agreement">
            <div className="agreement__menu">
                <div >
                    { menuItems.map((i, index) => { return <div onClick={this.scrollTo.bind(this, index)} key={index}>{i}</div> }) } 
                </div>
            </div>
            <div className="agreement__text" >
                <div ref={(el) => { this.textContainer = el; }} dangerouslySetInnerHTML={{__html: html}}/>
                <InfoLinks />
            </div>
            
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        html: state.info.html,
    }
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getHtml: (infoType) => { dispatch(getHtml(infoType)) }
    }
}

export default  connect(mapStateToProps, mapDispatchToProps)(UserAgreementPage);