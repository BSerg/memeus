import React, {Component, Children} from 'react';
import ReactSVG from 'react-svg';
import {Link} from 'react-router-dom';

import './styles/PostButton.scss';

export default function PostButton({caption, icon, onClick, isActive, isAccent, className, to, children}) {
    let classNames = ["post_button"];
    if (className) {
        classNames.push(className);
    }
    if (isActive) {
        classNames.push("post_button--active");
    }
    if (icon && !caption) {
        classNames.push("post_icon_button");
    }
    if (caption) {
        classNames.push("post_text_button");
    }
    if (isAccent) {
        classNames.push("post_button--accent");
    }

    const fullClassName = classNames.join(" ");
    if (to) {
        return <Link to={to} className={fullClassName}>
            {icon && <ReactSVG path={icon}/>}
            { children }
        </Link>;
    }

    return <button onClick={onClick} className={fullClassName}>
        {icon && <ReactSVG path={icon}/>}
        { caption && <span>{caption}</span> }
    </button>
}


/*export class PostButtonNew extends Component {

    constructor(props) {
        super(props);

        this.state = {className: this._getClassName(props), }

    }

    _getClassName() {
        let classNames = ["post_button"];
        const {caption, icon, onClick, isActive, isAccent, className} = this.props;
        if (isActive) {
            classNames.push("post_button--active");
        }
        if (icon && !caption) {
            classNames.push("post_icon_button");
        }
        if (caption) {
            classNames.push("post_text_button");
        }
        if (isAccent) {
            classNames.push("post_button--accent");
        }
        return classNames.join(' ');

    }

    render() {
        console.log('render');
        const {icon, caption, onClick}  = this.props;

        const className = this._getClassName();

        return <button onClick={onClick} className={className}>
            {icon && <ReactSVG path={icon}/>}
            { caption && <span>{caption}</span> }
        </button>
    }
}*/