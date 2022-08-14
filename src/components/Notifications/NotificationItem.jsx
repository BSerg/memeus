import React, {Component} from 'react';
import {connect} from 'react-redux';


export class NotificationItem extends Component {

    hideTimeout;

    constructor(props) {
        super(props);
        this.state = {hidden: !props.isDispalyed, isHiding: false, isNew: true};
        this.hide = this.hide.bind(this);
    }

    hide() {
        this.setState({isHiding: true}, () => {
            setTimeout(() => { this.setState({hidden: true}); }, 200);
        });
        

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isDispalyed !== this.props.isDispalyed && !nextProps.isDispalyed) {
            clearTimeout(this.hideTimeout);
            this.hide();
        }
    }

    componentDidMount() {
        if (!this.state.hidden) {
            setTimeout(() => { this.setState({isNew: false}) }, 0);
            setTimeout(this.hide, 3000);
        }
    }

    render() {
        const {text, bottomIndex} = this.props;
        const {hidden, isHiding, isNew} = this.state;
        if (hidden) {
            return null;
        }
        const style = {bottom: `${bottomIndex * 60 - (isNew ? 60 : 0) }px`};

        return <div onClick={this.hide} 
                    className={`notification${ isHiding ? ' notification--hidden' : '' }`} 
                    style={style} 
                    dangerouslySetInnerHTML={{__html: text}}/>
    }
}

export default connect(null, null)(NotificationItem);
