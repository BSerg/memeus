import React, {Component} from 'react';
import {connect} from 'react-redux';

import {ModalContainer} from '../../shared';
import {setWithdrawOpen, withdraw} from './actions/actions';

import './styles/ProfileWithdraw.scss';

export class ProfileTokenWithDraw extends Component {

    constructor() {
        super();
        this.state = {address: '', confirmed: false};
    }

    handleChange = (e) => { this.setState({address: e.target.value}); };
    handleConfirm = (e) => { this.setState({confirmed: e.target.checked}) };
    
    withdraw = () => { this.props.withdraw(this.state.address); };

    render() {
        if (!this.props.open) {
            return null;
        }
        const {close, captions} = this.props;
        const {address, confirmed} = this.state;
        return <ModalContainer closeHandler={close}>
            <div className="profile__withdraw">
                <p className="profile__withdraw_block">
                    <input type="text" id="platformAddress" 
                        value={address} 
                        placeholder={captions["managePaymentsWithdrawAddress"]}
                        onChange={this.handleChange}/>
                </p>
                <p className="profile__withdraw_block profile__withdraw_block__checkbox">
                    <input type="checkbox" 
                            checked={confirmed}
                            id="confirmWithdraw" onChange={this.handleConfirm}/>
                    <label htmlFor="confirmWithdraw">{captions["managePaymentsWithdrawConfirm"]}</label>
                </p>
                <p className="profile__withdraw_block profile__withdraw_block__buttons">
                    <button disabled={!address || !confirmed} onClick={this.withdraw}>
                        {captions["managePaymentsWithdrawSubmit"]}
                    </button>
                    <button onClick={close}>{captions["managePaymentsWithdrawCancel"]}</button>
                </p>
            </div>
            
        </ModalContainer>
    }
    
}

export default connect(
    (state) => {
        return {
            open: state.paymentData.withdrawOpen,
            captions: state.localization.captions,
        }
    },
    (dispatch) => {
        return {
            close: () => { dispatch(setWithdrawOpen(false)) },
            withdraw: (address) => { dispatch(withdraw(address)) },
        }
    }


)(ProfileTokenWithDraw);