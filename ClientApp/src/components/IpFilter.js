import React, { useState } from 'react';
import { isIPv4, isIPv4Network } from '../Utils'

function IpFilter(props) {

    const [validInput, setValidInput] = useState(true);

    // Set invalid input state, and signal parent of invalid input
    function setFilterValidity(validity) {
        setValidInput(validity);
        props.setFilterValidity(validity);
    }

    function handleInputChange(event) {

        const filterString = event.target.value;

        // Empty filter
        if (filterString === '') {
            props.onChangeValidInput(filterString);
            setFilterValidity(true);
            return;
        }

        const filters = filterString.split(',');
        for (const filter of filters) {
            // IPv4
            if (isIPv4(filter)) {
                continue
            }

            // Network
            if (isIPv4Network(filter)) {
                continue;
            }

            // Invalid input
            setFilterValidity(false);
            return false;
        }

        // Valid input
        props.onChangeValidInput(filterString);
        setFilterValidity(true);
        return true;
    }

    return (
        <div>
            <h5><b>{`${props.title}:`}</b></h5>
            <input onChange={handleInputChange}></input>
            {!validInput && <p style={{ color: '#F77', fontSize: '13px' }}><b>Valid Input: 192.168.1.0/24, 1.1.1.1, ...</b></p>}
        </div>
    );
}

export default IpFilter;