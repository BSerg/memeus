import React from 'react';
import {NavLink} from 'react-router-dom';


import './styles/NavMenu.scss';

export default function NavMenu({items}) {
    if (!items || !items.length) {
        return null
    }
    return <div className="nav_menu">
        {
            items.map((item, index) => {
                return <NavLink exact to={item.to} key={item.key || item.to || index}>{item.label}</NavLink>
            })
        }
    </div>
}