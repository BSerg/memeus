import {Actions} from 'utils/constants';



const initialState = {
    balanceLoading: false,
    balance: {total: 0, author: 0, reader: 0, referal: 0},
    withdrawalEnabled: false,
    withdrawalMinValue: null,
    transactionItems: [],
    transactionsLoading: false,
    wallet: null,
    loading: false,
    withdrawOpen: false,
};


export default function paymentData(state=initialState, action) {
    switch(action.type) {
        case Actions.PAYMENTS_BALANCE_LOADING:
            return {...state, balanceLoading: true};
        case Actions.PAYMENTS_BALANCE_SET:
            return {
                ...state, 
                balanceLoading: false, 
                balance: action.balance, 
                withdrawalEnabled: action.withdrawalEnabled,
                withdrawalMinValue: action.withdrawalMinValue,
            };
        case Actions.PAYMENTS_TRANSACTIONS_LOADING:
            return {...state, transactionsLoading: true};
        case Actions.PAYMENTS_TRANSACTIONS_SET:
            return {...state, transactionsLoading: false, transactionItems: action.items};
        case Actions.PAYMENTS_WITHDRAW_OPEN:
            console.log(action);
            return {...state, withdrawOpen: !!action.open};
        default:
            return state;
    }
}