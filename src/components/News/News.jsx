import React from 'react';
import {connect} from 'react-redux';

import {ModalContainer} from '../shared';
import './style.scss';


export const News = ({text, close}) => {

    if (!text) {
        return null;
    }

    return <ModalContainer closeHandler={close}>
        <h3 className="news_header">MEMEUS NEWS</h3>
        <div className="news" dangerouslySetInnerHTML={{__html: text}}/>
    </ModalContainer>
}

export default connect(
    (state) => {
        return {
            ...state.news
        }
    },
    (dispatch) => {
        return {
            close: () => { dispatch({type: 'NEWS_SET', text: null}) },
        }
    }
)(News);