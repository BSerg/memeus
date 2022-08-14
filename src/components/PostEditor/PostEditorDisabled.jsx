import React from 'react';
import {connect} from 'react-redux';


export const PostEditorDisabled = ({text}) => <div id="post_editor_disabled">
    {text}
</div>;

export default connect((state) => {
    return {
        text: state.localization.captions["imageUploadDisabled"]
    }
}, null)(PostEditorDisabled);