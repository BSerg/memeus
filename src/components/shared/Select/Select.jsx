import React, {Component} from 'react';
import DropDown from  './images/dropdown.png';


import './styles/Select.scss';

export class Select extends Component {

    constructor() {
        super();
        this.state = {open: false};
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        this.setState({open: !this.state.open});
    }

    close() {
        this.setState({open: false});
    }

    handleSelect(val) {
        this.setState({open: false});
        this.props.onChange && this.props.onChange(val);
    }

    render() {
        let {items, value} = this.props;
        let {open} = this.state;
        if (!items) {
            return [];
        }
        let selectedItem = items.find((item, index, arr) => {
            return item.value === value;
        });
        return <div className="select" onMouseLeave={this.close}>
            <img src={DropDown} className={open ? "rotated" : ""}/>
            <div className="select__current" onClick={this.toggle}>
                {selectedItem && selectedItem.label}
            </div>
            <div className={`select__items${open ? ' open' : ''}`}>
                {items.map((item, index) => {
                    return <div key={item.value + index} 
                                className={item.value === value ? 'select__items_item--active' : ''}
                                onClick={this.handleSelect.bind(this, item.value)}>
                        {item.label}
                    </div>
                })}
            </div>
        </div>
    }
}

export default Select;