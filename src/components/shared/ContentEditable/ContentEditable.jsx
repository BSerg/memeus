import React, {Component} from 'react';


export class ContentEditable extends Component {

    render() {
        const {className, disabled} = this.props;
        return <div contentEditable={!disabled} className={className}/>
    }
}

export default ContentEditable;