import React, {Component} from 'react';
import {connect} from 'react-redux';

import Loading from 'components/shared/Loading/Loading';
import {processImageClient} from 'utils/processImageClient';
import {uploadAvatar} from '../actions/userActions';

export function ProfileAvatarSimple({avatar}) {
    let className = 'profile_avatar';
    if (!avatar || !avatar.path) {
        className += ' profile_avatar--dummy';
    }
    return <div className={className} >
        { avatar && avatar.path && <img src={avatar.path} alt=""/>}
    </div>
}

export class ProfileAvatar extends Component {
    
    input;
    canvas;

    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleClick() {
        if (!this.props.editable || this.props.avatarUploading) {
            return;
        }
        this.input.click();
    }

    handleChange(e) {
        let file = this.input.files[0];
        if (!file) {
            return;
        }
        let objectBlob = window.URL.createObjectURL(file);
        this.input.value = '';
        processImageClient(this.canvas, objectBlob, 100, 100).then((f) => {
            this.props.uploadAvatar(f);
        }).catch(() => { console.log(err) });
    }

    render() {
        let {avatar, editable, avatarUploading} = this.props;
        let classNames = ['profile_avatar'];
        if (editable && !avatarUploading) {
            classNames.push('profile_avatar--editable');
        }
        if (!avatar || !avatar.path) {
            classNames.push('profile_avatar--dummy')
        }
    
        return <div className={classNames.join(' ')} 
                    onClick={this.handleClick}>
            { avatar && avatar.path && <img src={avatar.path} alt=""/>}
            { avatarUploading && <div className="profile_avatar_loading"><Loading /></div> }
            {editable && <input type="file" accept="image/jpeg,image/png,image/gif" 
                                            ref={(input) => {this.input = input}}
                                            style={{display: 'none'}}
                                            onChange={this.handleChange}/>}
            {editable && <canvas style={{display: 'none'}} ref={(c) => {this.canvas = c}}/>}
        </div>
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        avatarUploading: state.userData.avatarUploading,
    }
}

const mapStateDispatchToProps = (dispatch) => {
    return {
        uploadAvatar: (file) => { dispatch(uploadAvatar(file)) }
    }
}

export default connect(mapStateToProps, mapStateDispatchToProps)(ProfileAvatar);