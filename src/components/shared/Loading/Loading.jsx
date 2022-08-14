import React, {Component} from 'react';
import './styles/Loading.scss';


export default function Loading() {
    return <div className="loading">
        { [0, 1, 2].map((i) => { return <div key={i} className={`loading__${i}`} /> }) }
    </div>
}