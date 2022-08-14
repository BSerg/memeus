import React from 'react';
import {connect} from 'react-redux';
import LoginPage from './LoginPage';
import {ModalContainer} from 'components/shared';
import {closeModal} from './actions';

import './styles/LoginModal.scss';

export function LoginModal({open, close}) {
    if (!open) {
        return null;
    }
    return <ModalContainer closeHandler={close} zIndex={5}>
        <LoginPage />
    </ModalContainer>
}

const mapStatToProps = (state) => {
    return {
        open: state.menu.loginModalOpen
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        close: () => { dispatch(closeModal()); }
    }
}


export default connect(mapStatToProps, mapDispatchToProps)(LoginModal);
