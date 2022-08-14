import React from 'react';
import {connect} from 'react-redux';


import faq from 'utils/texts/faq.json';

function getItems(lang) {
    return faq.FAQ;
}

export function FAQPage({lang}) {

    const items = getItems(lang);
    return items.map((itm) => {
        return [
            <h3 className="about__question" key={itm.key + 'q'}>{itm.q}</h3>,
            <div className="about__answer" key={itm.key + 'a'} dangerouslySetInnerHTML={{__html: itm.a}} />,
        ]
    })
}

const mapStateToProps = (state) => {
    return {
        lang: state.localization.lang
    }
}

export default connect(mapStateToProps, null)(FAQPage);