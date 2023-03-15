import React, { useState } from 'react';
import { parsePercentage } from '../Utils'

function PercentInput(props) {

    const [errorMessage, setErrorMessage] = useState('');
    const [time, setTime] = useState(0);


    function handleInputChange(event) {
        const inputString = event.target.value;
        if (inputString == null || inputString == '') {
            onInvalidTime('');
            return;
        }

        const percentage = parsePercentage(inputString);
        if (!isNaN(percentage)) {
            if (percentage <= 0.0001 || percentage > 100.0) {
                onInvalidTime('Valid percentage: 0% < P <= 100%');
                return;
            }

            onValidTime(props.captureLength * percentage / 100.0)
            return;
        }

        onInvalidTime('Valid Input: X%');
    }

    function onValidTime(time) {
        setErrorMessage('');
        setTime(time);
        if (props.setTime != null) {
            props.setTime(time);
        }
    }

    function onInvalidTime(errorMessage) {
        setErrorMessage(errorMessage);
        setTime(null);
        if (props.setTime != null) {
            props.setTime(null);
        }
    }

    return (
        <div>
            <h5>{`${props.title}:`}</h5>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px' }} />
            </div>
            {errorMessage == '' ? <br /> : <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentInput;