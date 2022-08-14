import React from 'react';
import {connect} from 'react-redux';
import {ModalContainer} from 'components/shared';

import './styles/BanMessage.scss';

export function BanMessage({text, closeCallback}) {

    return <ModalContainer closeHandler={closeCallback} zIndex={100}>
        <div className="ban_message__text">{text}</div>
    </ModalContainer>
}

const mapStateToProps = (state) => {
    return {
        text: state.localization.captions["banText"],
    }
}

export default connect(mapStateToProps, null)(BanMessage);