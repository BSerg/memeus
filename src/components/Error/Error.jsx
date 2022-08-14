import React from 'react';
import {connect} from 'react-redux';

import './styles/Error.scss';

export function ErrorContent({code, text}) {

    return <div className="error__content">
        <div className="error__code">{code}</div>
        <div className="error__text">{text}</div>
    </div>
}



export function ErrorClass({code = 500, captions}) {
    const text = code === 404 ? captions["error404"] : captions["errorDefault"];
    
    return <div className="error">
        <ErrorContent code={code} text={text}/>
    </div>
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions
    }
}

export const Error = connect(mapStateToProps, null)(ErrorClass);


export function Error404() {
    return <Error code={404}/>
}

export default Error;
