import React from 'react';
import {connect} from 'react-redux';

import PostEditor from './PostEditor';
import SideBanner from 'components/banners/SideBanner';


export function PostEditorPage({displaySideBanner}) {

    return [
        <PostEditor key="editor"/>,
        displaySideBanner ? <SideBanner key="banner"/> : null,
    ]
}

const mapStateToProps = (state) => {
    return {
        displaySideBanner: state.screen.width >= 960 && state.userData.user,
    }
}

export default connect(mapStateToProps, null)(PostEditorPage);