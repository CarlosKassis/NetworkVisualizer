import React, { useEffect, useState } from 'react';
import { parsePercentage, parseTime } from '../Utils'

// Component that takes percentage input from field and returns normalized percentage ('65%' => 0.65)
function PercentOrTimeInput(props) {

    const [errorMessage, setErrorMessage] = useState('');
    const [input, setInput] = useState(null);

    useEffect(() => {
        if (input == null || input == '') {
            onInvalidRatioChange(null);
            return;
        }

        const percentage = parsePercentage(input);
        if (!isNaN(percentage)) {
            onValidRatioChange(percentage / 100.0)
            return;
        }

        onInvalidRatioChange('Valid Input: X%');
    }, [input, props.captureLength])

    function handleInputChange(event) {
        setInput(event.target.value);
    }

    function onValidRatioChange(ratio) {
        setErrorMessage('');
        props.onRatioChange(ratio);
    }

    function onInvalidRatioChange(errorMessage) {
        setErrorMessage(errorMessage);
        props.onRatioChange(null);
    }

    return (
        <div>
            <h5 style={{ marginTop: '10px' }}>{`${props.title}:`}</h5>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px', marginTop: '5px' }} />
            </div>
            {errorMessage == '' ? <br/> : <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;