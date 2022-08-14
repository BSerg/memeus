import React, {Component} from 'react';
import {connect} from 'react-redux';

import {getTransactions} from './actions/actions';

import {ProfileManagementBlock} from '../ProfileShared';
import {Loading} from 'components/shared';

import {formatValue, paymentToText, withdrawalToText} from '../../../utils/format';

function timeStampToDate(ts) {
    try {
        let date = new Date(parseInt(ts));
        return `${date.getDate()}.${date.getMonth() + 1}`;
    } catch(err) {
        return null;
    }
}

function transactionToText(item, captions) {
    switch(item.type) {
        case 'payment':
            return paymentToText(item, captions);
        case 'withdrawal':
            return withdrawalToText(item, captions);
        default:
            return ''
    }
}

function typeToText(itemType, captions) {
    
    switch(itemType) {
        case 1:
            return captions["manageIncomeReader"];
        case 2:
            return captions["manageIncomeAuthor"];
        case 3:
            return captions["manageIncomeReferal"];
        default:
            return ""
    }
}


export function ProgfileManagementTransactionFunc({date, text, value}) {

    return <div className="profile__management__transaction">
        <div>{date}</div>
        <div>{text}</div>
        <div>{value} T</div>
    </div>
}

const mapStateToPropsTransaction = (state, ownProps) => {
    return {
        value: ownProps.item.value,
        date: timeStampToDate(ownProps.item.date),
        text: transactionToText(ownProps.item, state.localization.captions),
    }
}
    
const ProgfileManagementTransaction = connect(mapStateToPropsTransaction, null)(ProgfileManagementTransactionFunc);
    
    
    
export class ProfileManagementTransactions extends Component {

    componentDidMount() {
        this.props.getTransactions();
    }

    render() {
        const {captions, items, loading} = this.props;
        return <ProfileManagementBlock caption={captions["managePaymentsTransactions"]}>
            {items.map(i => <ProgfileManagementTransaction item={i} key={i._id}/> )}

            {loading && <Loading />}
        </ProfileManagementBlock>
    }
}


const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
        items: state.paymentData.transactionItems,
        loading: state.paymentData.transactionsLoading,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        getTransactions: () => { dispatch(getTransactions()); }
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ProfileManagementTransactions);