import React, { useState, useEffect } from 'react';

function Dropdown(props) {

    const [selectedItem, setSelectedItem] = useState('');

    // Filter after changing graph elements
    useEffect(() => {
        if (props.optionsItems.length == 0) {
            return;
        }

        setSelectedItem(props.optionsItems[0]);
        onChangeOption(props.optionsItems[0]);
    }, [props.optionsItems]);

    function onChangeOption(value) {
        props.setSelectedItems(value);
        setSelectedItem(value);
    }

    return (
        <div >
            <select value={selectedItem} onChange={(e) => onChangeOption(e.target.value)}>
                {props.optionsItems.map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                ))}
            </select>
        </div>
    );
}

export default Dropdown;