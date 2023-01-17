import React, { useState } from 'react';

function IpFilter(props) {

    const [validInput, setValidInput] = useState(true);

    function isInteger(str) {
        return /^\d+$/.test(str);
    }

    function isIPv4(str) {
        var ipParts = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (!ipParts) {
            return false;
        }

        for (const part of ipParts) {
            if (part < 0 || part > 255) {
                return false;
            }
        }

        return true;
    }

    function isIPv4Network(str) {
        const subnetParts = str.split('/');
        if (subnetParts.length != 2) {
            return false;
        }

        if (!isInteger(subnetParts[1])) {
            return false;
        }

        const mask = Number(subnetParts[1]);
        if (mask < 0 || mask > 32) {
            return false;

        }

        if (!isIPv4(subnetParts[0])) {
            return false;
        }

        return true;
    }

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