import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import ReactSVG from 'react-svg';
import CloseIcon from './images/close_white.svg';


import './styles/ModalContainer.scss';



export class ModalContainer extends Component {

    close = () => {
        if (this.props.closeHref) {
            this.props.history.push(this.props.closeHref);
        }
        else {
            this.props.closeHandler && this.props.closeHandler();
        }
    }

    cancel = e => e.stopPropagation();

    render() {
        const {className, zIndex, closeHref, closeHandler, children} = this.props;
        const style = zIndex !== undefined ? {zIndex} : {};
        return <div className={`modal${className ? ' ' + className : ''}`} style={style} onClick={this.close}>
        
            <div className="modal__content" onClick={this.cancel}>
                {children}
                { closeHref && <Link className="modal__close" to={closeHref}><ReactSVG path={CloseIcon}/></Link> }
                { !closeHref && closeHandler && <div className="modal__close" onClick={closeHandler}><ReactSVG path={CloseIcon}/></div> }
            </div>
        </div>;
    }
}



export default withRouter(ModalContainer);