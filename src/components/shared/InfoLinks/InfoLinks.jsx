import React from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';

import './InfoLinks.scss';

export function InfoLinks({captions}) {
    return <div className="info__links">
        <Link to="/agreement">{ captions["linkAgreement"] }</Link>
        <Link to="/confidentiality">{ captions["linkConfidentiality"] }</Link>
        <a href="mailto:info@memeus.ru" target="_blank">{ captions["linkContact"] }</a>
    </div>
}


const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
    }
}

export default connect(mapStateToProps, null)(InfoLinks);