import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from 'store/store';
import Base from './Base/Base';
import ContentPage from './ContentPage/ContentPage';
import {Profile, ProfileManagement} from './Profile';
import LoginPage from './LoginPage/LoginPage';
import PostEditorPage from './PostEditor/PostEditorPage';
import {Error404} from './Error/Error';
import UserAgreementPage from './UserAgreementPage/UserAgreementPage';
import InstructionPage from './InstructionPage/InstructionPage';
import InfoPage from './InfoPage/InfoPage';


class App extends Component {
    render() {
        return <Provider store={store}>
            <BrowserRouter>
            <Base>
            <Switch>
                <Route exact path="/" component={ContentPage} />
                <Route exact path="/best" component={ContentPage} />
                { process.env.SUBSCRIPTION_ENABLED && <Route exact path="/subscriptions" component={ContentPage} /> }
                <Route exact path="/fresh" component={ContentPage} />
                <Route exact path="/add" component={PostEditorPage} />
                <Route path="/manage/:slug" component={ProfileManagement} />
                <Route path="/manage" component={ProfileManagement} />
                <Route path="/signin" component={LoginPage} />
                <Route path="/signup" component={LoginPage} />
                <Route path="/agreement" component={UserAgreementPage} />
                <Route path="/confidentiality" component={UserAgreementPage} />
                <Route path="/about" component={InfoPage} />
                <Route exact path="/m/:slug" component={ContentPage} />
                <Route exact path="/u/:nickname" component={ContentPage} />
                <Route exact path="/u/:nickname/:section" component={ContentPage} />
                <Route exact path="/instruction" component={InstructionPage} />
                <Route component={Error404}/>
            </Switch>
            </Base>
            </BrowserRouter>
        </Provider>;
    }
}

export default App;