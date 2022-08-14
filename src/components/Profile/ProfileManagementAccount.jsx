import React, {Component} from 'react';
import {ProfileManagementBlock} from './ProfileShared';
import {connect} from 'react-redux';
import {Loading, Select, InfoLinks} from 'components/shared';
import {Languages} from 'utils/constants';
import {setNicknameError, saveNewNickname, setLanguage} from './actions/userActions';

import {notifyUrlCopy} from 'store/actions/common';

import './styles/ProfileManagementAccount.scss';

export class ProfileManagementLanguageClass extends Component {

    handleChange(val) {
        this.props.setLanguage(val);
    }
    
    render() {
        let {captions, language} = this.props;
        let items = Languages.map((l) => { return {value: l.code, label: l.label} });
        return <ProfileManagementBlock caption={captions['profileLangaugeLabel']}>
            <div style={{maxWidth: '470px', width: '100%'}}>
                <Select items={items} value={language} onChange={this.handleChange.bind(this)}/>
            </div>
        </ProfileManagementBlock>
    }
}

const mapStateToPropsLanguage = (state) => {
    return {
        captions: state.localization.captions,
        language: state.localization.language,
    }
}

const mapDispatchToPropsLanguage = (dispatch) => {
    return {
        setLanguage: (lang) => { dispatch(setLanguage(lang)) }
    }
}

const ProfileManagementLanguage = connect(mapStateToPropsLanguage, mapDispatchToPropsLanguage)(ProfileManagementLanguageClass);

export class ProfileManagementReferalClass extends Component {
    input;

    constructor() {
        super();
        this.state = {linkCopied: false};
        this.handleFocus = this.handleFocus.bind(this);
    }

    handleFocus() {
        if (this.state.linkCopied) {
            return;
        }
        try {
            this.input.focus();
            this.input.select();
            document.execCommand('copy');
            this.props.notify();

        } catch(err) {}
    }

    render() {
        let {captions, referals, nickname} = this.props;
        let url = `https://memeus.ru/signup/?ref=${nickname}`;
        return <ProfileManagementBlock caption={captions['profileReferalLabel']}>
            <input type="text" value={url} 
                               ref={(el) => {this.input = el}}
                               onClick={this.handleFocus}
                               onChange={() => {}}/>
            <div className="hint">{captions['profileReferalHint']}</div>
            <div className="hint">
                {captions['profileFriendsInvited']}: <strong>{referals}</strong>
            </div>
                    
        </ProfileManagementBlock>
    }
}

const mapStateToPropsReferal = (state) => {
    return {
        captions: state.localization.captions,
        nickname: state.userData.user.nickname,
        referals: state.userData.user.referals,
    }
}

const mapDispatchToPropsReferal = (dispatch, ownProps) => {
    return {
        notify: () => { dispatch(notifyUrlCopy()) }
    }
}

const ProfileManagementReferal = connect(mapStateToPropsReferal, mapDispatchToPropsReferal)(ProfileManagementReferalClass);


export class ProfileManagementNicknameClass extends Component {
    constructor(props) {
        super(props);
        this.state = { nickname: props.nickname, saving: false, canSave: false };
        this.handleChange = this.handleChange.bind(this);
        this.handleClickSave = this.handleClickSave.bind(this);
    }

    handleChange(e) {
        this.props.setNicknameError(false);
        let val = e.target.value.toLowerCase();
        if ((val === '' || val.match(/^[A-Za-z][A-Za-z\d\._-]*$/)) && val.length <= 30 ) {
            this.setState({nickname: val, canSave: val.length > 3 && val !== this.props.nickname});
        }
    }

    handleClickSave() {
        this.setState({saving: true, canSave: false}, () => {
            this.props.saveNewNickname(this.state.nickname);
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nickname !== this.props.nickname) {
            this.setState({nickname: nextProps.nickname, saving: false, canSave: false});
        }
        if (nextProps.error || !this.props.error) {
            this.setState({saving: false, canSave: false});
        }
    }
    componentWillUnmount() {
        this.props.setNicknameError(false);
    }

    render() {
        let {nickname, saving, canSave} = this.state;
        let {error, captions} = this.props;
        return <ProfileManagementBlock caption={captions['profileNicknameLabel']}>
            <div className="profile_management_nickname">
                <div>
                    <input className={error ? 'profile__input--error' : ''} type="text" value={nickname} onChange={this.handleChange} disabled={saving}/>
                </div>
                { error && <div className="hint hint_error">{captions['profileNicknameError']}</div> }
                <div className="profile_management_nickname__save">
                    {saving && <Loading />}
                    {canSave && <button onClick={this.handleClickSave}>
                        {captions['profileNicknameSave']}
                    </button>}
                </div>
                <div className="hint">
                    {captions['profileNicknameRules']}
                </div>
            </div>
        </ProfileManagementBlock>
    }
}

const mapStateToPropsNickname = (state) => {
    return {
        nickname: state.userData.user.nickname,
        error: !!state.userData.errors.nickname,
        captions: state.localization.captions,
    }
}

const mapDispatchToPropsNickname = (dispatch) => {
    return {
        setNicknameError: (error) => { dispatch(setNicknameError(!!error)) },
        saveNewNickname: (nickname) => { dispatch(saveNewNickname(nickname)) },
    }
}

const ProfileManagementNickname = connect(mapStateToPropsNickname, mapDispatchToPropsNickname)(ProfileManagementNicknameClass);


export default function ProfilemanagementAccount() {
    return [
        <ProfileManagementNickname key="nickname" />,
        <ProfileManagementLanguage key="lang"/>,
        <ProfileManagementReferal key="referral"/>,
    ]
}