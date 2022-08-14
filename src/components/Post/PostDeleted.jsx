import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactSVG from 'react-svg';
import {restorePost} from './actions/actions';

import CloseIcon from './images/close_white.svg';

export class PostDeleted extends Component {

    constructor() {
        super();
        this.state = {removed: false};
        this.remove = this.remove.bind(this);
    }

    remove() {
        this.setState({removed: true});
    }

    render() {
        if (this.state.removed) {
            return null;
        }
        const {restore, captionRestore, captionDeleted, isList} = this.props;
        return <div className="post deleted">
            {captionDeleted} <span onClick={restore}>{captionRestore}</span>
            {isList && <div onClick={this.remove}><ReactSVG path={CloseIcon}/></div>}
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        captionDeleted: state.localization.captions["postDeleted"],
        captionRestore: state.localization.captions["postRestore"],
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        restore: () => { dispatch(restorePost(ownProps.post.slug)); }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostDeleted);