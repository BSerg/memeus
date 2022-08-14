import React from 'react';
import {Link} from 'react-router-dom';
import ReactSVG from 'react-svg';
import VKIcon from './images/vk.svg';
import FBIcon from './images/fb.svg';
import TwitterIcon from './images/twitter.svg';
import GoogleIcon from './images/google.svg';

import './styles/LoginBlock.scss';


const LOGIN_LINKS = [
    {to: "/oauth/vk", className: "login_block__vk", icon: VKIcon, path: "./images/vk.svg"},
    {to: "/oauth/facebook", className: "login_block__facebook", icon: FBIcon, path: "./images/vk.svg"},
    {to: "/oauth/twitter", className: "login_block__twitter", icon: TwitterIcon, path: "./images/vk.svg"},
    {to: "/oauth/google", className: "login_block__google", icon: GoogleIcon, path: "./images/vk.svg"},
]

export default function LoginBlock({className}) {
    let classNames = ['login_block', className || null];
    return <div className={classNames.join(' ')}>
        { LOGIN_LINKS.map((linkData) => {
            return <a href={linkData.to} key={linkData.className} className={linkData.className}>
                <ReactSVG path={linkData.icon} />
            </a>
        }) }
    </div>
}