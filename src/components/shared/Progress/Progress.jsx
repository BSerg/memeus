import React from 'react';


import './style.scss';

export function Progress({value, max, className, colorBg, colorBar}) {
    max = max || 100;
    value = value || 0;
    let progress = (value / max) * 100;
    if (progress > 100) {
        progress = 100;
    }

    const styleMain = colorBg ? { backgroundColor: colorBg } : {};
    const styleBar = colorBar ? { backgroundColor: colorBar } : {};
    className = `progress ${className || ''}`;
    return <div className={className}>
        <div className="progress__status" style={{ width: `${progress}%` }} />
    </div>
}

export default Progress;