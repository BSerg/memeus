import React, {Component} from 'react';
import {StaticRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import Base from './Base/Base';

import {store} from 'store/serverStore';

export default class RenderContainer extends Component {

    render() {
        let {children, lang} = this.props;
        return <Provider store={store}><StaticRouter context={{}}>
                    <Base>
                    {children}
                    </Base>
            </StaticRouter>
            </Provider>
    }
}