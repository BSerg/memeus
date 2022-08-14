import React, {Component} from 'react';
import PropTypes from 'prop-types';

const isReady = () => {
    try {
        return !!grecaptcha;
    }
    catch (err) {
        return false;
    }
}


export default class ReCaptcha extends Component {

    readyInterval;

    static propTypes = {
        elementID: PropTypes.string,
        verifyCallback: PropTypes.func,
        expiredCallback: PropTypes.func,
        verifyCallbackName: PropTypes.string,
        expiredCallbackName: PropTypes.string,
        hidden: PropTypes.bool
    }

    static defaultProps = {
        verifyCallback: undefined,
        verifyCallbackName: 'verifyCallback',
        expiredCallback: undefined,
        expiredCallbackName: 'expiredCallback',
        hidden: false,
    }

    constructor() {
        super();
        this.state = {ready: isReady()};
        if (!this.state.ready) {
            this.readyInterval = setInterval(this._updateReadyState.bind(this), 50);
        }
    }

    _updateReadyState() {
        if (isReady()) {
            this.setState({
                ready: true,
            });
            clearInterval(this.readyInterval);
        }
    }

    _renderGreCaptcha() {
        grecaptcha.render(this.props.elementID, {
            sitekey: process.env.RE_CAPTCHA_KEY,
            callback: (this.props.verifyCallback) ? this.props.verifyCallback : undefined,
            'expired-callback': (this.props.expiredCallback) ? this.props.expiredCallback : undefined,
        })
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.ready && !prevState.ready) {
            this._renderGreCaptcha()
        }
    }

    componentDidMount() {
        if (this.state.ready) {
            this._renderGreCaptcha();
        }
    }

    componentWillUnmount() {
        clearInterval(this.readyInterval);
    }

    render() {
        return <div id={this.props.elementID} style={{display: this.props.hidden ? 'none' : 'block'}} />
    }
}