import {Actions} from 'utils/constants';
import {api} from 'utils/api';


export function getBalance(timeout=0) {
    return (dispatch) => {
        dispatch({type: Actions.PAYMENTS_BALANCE_LOADING});

        setTimeout(() => {
            api.get('/users/me/wallet').then((r) => {
                dispatch({type: Actions.PAYMENTS_BALANCE_SET, ...r.data});
            }).catch((err) => {
                dispatch({type: Actions.PAYMENTS_BALANCE_SET, balance: {total: 0, author: 0, reader: 0, referal: 0}});
            });
        }, timeout);
    }
}

export function getTransactions() {

    return (dispatch, getState) => {
        dispatch({type: Actions.PAYMENTS_TRANSACTIONS_LOADING});
        const {transactionItems} = getState().paymentData;
        api.get('/users/me/transactions').then((r) => {
            const items = [...r.data];
            dispatch({ type: Actions.PAYMENTS_TRANSACTIONS_SET, items });
        }).catch((err) => {
            const items = [];
            dispatch({ type: Actions.PAYMENTS_TRANSACTIONS_SET, items });
        });
    }
}


export function setWithdrawOpen(open) {
    return (dispatch, getState) => {

        const withdrawalEnabled = getState().paymentData.withdrawalEnabled;
        if (!withdrawalEnabled) {
            dispatch({type: Actions.PAYMENTS_WITHDRAW_OPEN, open: false});
        }
        else {
            dispatch({type: Actions.PAYMENTS_WITHDRAW_OPEN, open});
        }
    }
}

export function withdraw(address) {
    return (dispatch, getState) => {
        const captions = getState().localization.captions;
        api.post('/users/me/wallet/withdraw', {recipient: address}).then((r) => {
            dispatch(setWithdrawOpen(false));
            dispatch(getBalance(3000));
            dispatch(getTransactions());
            dispatch({type: Actions.NOTIFICATIONS_ADD, text: captions["managePaymentsWithdrawalSuccess"]});
        }).catch((e) => {
            dispatch(setWithdrawOpen(false));
            dispatch({type: Actions.NOTIFICATIONS_ADD, text: captions["managePaymentsWithdrawalError"]});
        });
    }
}