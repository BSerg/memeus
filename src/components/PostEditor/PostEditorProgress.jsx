import React from 'react';
import {connect} from 'react-redux';
import {setDefault} from './actions';
import {Loading, Progress} from 'components/shared';


import './styles/PostEditorProgress.scss';

export function PostEditorProgress({progress, error, uploading, setDefault, captions, errorCode}) {
    if (!uploading && !error) {
        return null;
    }
    let errorText = errorCode === 429 ? captions["editorErrorTooManyRequests"] : captions["editorError"];
    let buttonText = errorCode === 429 ? captions["editorRetryLater"] : captions["editorRetry"];

    return <div className="post_editor__progress">
        {uploading && !error && <Loading />}
        {error && [<span key="caption">{errorText}</span>,
                   <button key="button" onClick={setDefault}>{buttonText}</button>]}
    </div>
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
        errorCode: state.editor.errorCode,
        // progress: state.editor.progress,
    }
}

const mapDispatchToProps = (dispatch) => {

    return {
        setDefault: () => { dispatch(setDefault()); },
    }
    
}

export default connect(mapStateToProps, mapDispatchToProps)(PostEditorProgress);