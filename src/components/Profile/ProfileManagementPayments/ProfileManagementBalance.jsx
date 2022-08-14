import React, {PureComponent} from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';

import {getBalance, setWithdrawOpen} from './actions/actions';

import {ProfileManagementBlock} from '../ProfileShared';
import {Loading} from 'components/shared';


export class ProfileManagementBalance extends PureComponent {

    componentDidMount() {
        this.props.getBalance();
    }

    render() {
        const {balance, captions, loading, withdrawalEnabled, withdrawalMinValue, openWithdraw} = this.props;
        return (
            <ProfileManagementBlock caption={captions["managePaymentsBalance"]}>
                {loading && <Loading />}

                {!loading && [
                    <h5 key="total" className="profile--strong">{captions["managePaymentsBalanceTotal"]}: {balance.total} T</h5>,
                    <h5 key="author">{captions["managePaymentsBalanceAuthor"]}: {balance.author} T</h5>,
                    <h5 key="reader">{captions["managePaymentsBalanceUser"]}: {balance.reader} T</h5>,
                    <h5 key="referal">{captions["managePaymentsBalanceReferal"]}: {balance.referal} T</h5>,
                    <h5 key="min_value" className="profile--strong">
                        {captions["managePaymentsBalanceWithdrawalMin"]}: {withdrawalMinValue} T
                    </h5>,
                ]}
                

                <button disabled={!withdrawalEnabled} onClick={openWithdraw}>{captions["managePaymentsWithdraw"]}</button>

                <div className="profile__payments__hint" dangerouslySetInnerHTML={{__html: captions["paymentsHint"]}}/>
                <p className="profile__payments__instruction_link">
                    <Link to="/instruction">{captions["instructionLink"]}</Link>
                </p>
            </ProfileManagementBlock>
        )
    }
}

 

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
        ...state.paymentData,
        loading: state.paymentData.balanceLoading,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        getBalance: () => { dispatch(getBalance()); },
        openWithdraw: () => { dispatch(setWithdrawOpen(true)); }
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ProfileManagementBalance);