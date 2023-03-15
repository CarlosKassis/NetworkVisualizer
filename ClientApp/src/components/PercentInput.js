import React, { useState } from 'react';
import { parsePercentage } from '../Utils'

function PercentInput(props) {

    const [errorMessage, setErrorMessage] = useState('');
    const [percentage, setPercentage] = useState(0);


    function handleInputChange(event) {
        const inputString = event.target.value;
        if (inputString == null || inputString == '') {
            onInputChangeInvalid('');
            return;
        }

        const percentage = parsePercentage(inputString);
        if (!isNaN(percentage)) {
            onInputChangeValid(percentage / 100.0)
            return;
        }

        onInputChangeInvalid('Valid Input: X%');
    }

    function onInputChangeValid(time) {
        setErrorMessage('');
        setPercentage(time);
        console.log(time);
        if (props.onInputChange != null) {
            props.onInputChange(time);
        }
    }

    function onInputChangeInvalid(errorMessage) {
        setErrorMessage(errorMessage);
        setPercentage(null);
        if (props.onInputChange != null) {
            props.onInputChange(null);
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