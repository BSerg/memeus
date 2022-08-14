import React from 'react';
import {connect} from 'react-redux';
import NotificationItem from './NotificationItem';
import {add} from './actions';


import './styles/Notifications.scss';

export function Notifications({items, isMobile, add}) {

    return <div id="notifications">
        {items.map((item, index) => { 
            let isDispalyed = isMobile ? index === items.length -1 : index >= items.length - 3;
            let bottomIndex = items.length - index - 1;
            return <NotificationItem text={item} key={index} isDispalyed={isDispalyed} 
                bottomIndex={bottomIndex}/> })}
    </div>
}

const mapStateToProps = (state) => {
    return {
        items: state.notifications.items,
        isMobile: state.browser.isMobile,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        add: () => { dispatch(add()); }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);

