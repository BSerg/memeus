import React, {Component} from 'react';
import {connect} from 'react-redux';
import ReactSVG from 'react-svg';
const isMobile = false;

import VKIcon from './images/vk.svg';
import FBIcon from './images/fb.svg';
import TwitterIcon from './images/twitter.svg';
import TelegramIcon from './images/telegram.svg';
import WhatsappIcon from './images/whatsapp.svg';
import ViberIcon from './images/viber.svg';
import LinkIcon from './images/share_link.svg';
import CloseIcon from './images/close_white.svg';

import {notifyUrlCopy} from 'store/actions/common';


import './styles/PostShare.scss';

export const SOCIAL_LINKS = [
    {key: 'vk', href: 'https://vk.com/share.php?url=', social: 'vk', className: "post_share__link__vk", bg: '#44678d', icon: VKIcon },
    {key: 'fb', href: 'https://www.facebook.com/sharer/sharer.php?u=', className: "post_share__link__fb", social: 'fb', bg: '#3a559f', icon: FBIcon },
    {key: 'twitter', href: 'https://twitter.com/intent/tweet?text=', social: 'twitter', className: "post_share__link__twitter", bg: '#50abf1', icon: TwitterIcon },
];

export const MOBILE_LINKS = [
    {key: 'telegram', href: 'https://telegram.me/share/url?url=', social: 'telegram', className: "post_share__link__telegram", bg: '#61a8de', icon: TelegramIcon },
    {key: 'whatsapp', href: 'whatsapp://send?text=', className: "post_share__link__whatsapp", social: 'whatsapp', bg: '#1bd741', icon: WhatsappIcon },
    {key: 'viber', href: 'viber://forward?text=', social: 'viber', className: "post_share__link__viber", bg: '#7d3daf', icon: ViberIcon },
];

export function PostShareLinks({url, items}) {
    return items.map((item) => {
        return <a className={`post_share__link ${item.className}`}
                  href={item.href + url} target='_blank' 
                  key={item.key}>
                <ReactSVG path={item.icon}/>
            </a>;
    })
}


export class PostShare extends Component {
    input;

    constructor() {
        super();
        this.state = { urlDisplay: false };
        this.showUrl = this.showUrl.bind(this);
        this.hide = this.hide.bind(this);
        this.selectAndCopy = this.selectAndCopy.bind(this);
        this.hideUrl = this.hideUrl.bind(this);
    }

    hide() {
        this.setState({urlDisplay: false});
        this.props.close();
    }

    hideUrl() {
        this.setState({urlDisplay: false});
    }

    selectAndCopy() {
        try {
            this.input.focus();
            this.input.select();
            document.execCommand('copy');
            this.props.notify();
        } catch(err) {
            console.log(err);
        }
    }

    showUrl() {
        this.setState({urlDisplay: true}, this.selectAndCopy );
    }

    render() {
        let {post, open, isMobile, close} = this.props;
        let {urlDisplay} = this.state;
        
        let postUrl = `https://memeus.ru/m/${post.slug}`;
        
        let classNames = ['post_share'];
        if (urlDisplay) {
            classNames.push(' post_share--urldisplay');
        }
        if (open) {
            classNames.push(' post_share--open');
        }
    
        return <div className={classNames.join(' ')}>
            <div className="post_share__close" onClick={this.hide}><ReactSVG path={CloseIcon}/></div>
            <div className="post_share__row">
                <PostShareLinks url={postUrl} items={SOCIAL_LINKS}/>
                { !isMobile && <div className="post_share__link post_share__link--url" onClick={this.showUrl}>
                    <ReactSVG path={LinkIcon}/>
                </div> }
            </div>
            {
                isMobile && <div className="post_share__row">
                    <PostShareLinks url={postUrl} items={MOBILE_LINKS}/>
                </div>
            }
            <input ref={(el) => {this.input = el}} type="text" 
                    data-copytarget={postUrl}
                    value={postUrl}
                    onBlur={this.hideUrl}
                    onClick={this.selectAndCopy} onChange={() => {}} />
    
        </div>


    }
}

const mapStateToProps = (state) => {
    return {
        isMobile: state.browser.isMobile
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        notify: () => { dispatch(notifyUrlCopy()) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostShare);