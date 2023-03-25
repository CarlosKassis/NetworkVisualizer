import React, { useEffect, useState } from 'react';
import { parsePercentage } from '../Utils'

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
            onValidInputChange(percentage)
            return;
        }

        onInvalidRatioChange('Valid Input: X%');
    }, [input, props.captureLength])

    function handleInputChange(event) {
        setInput(event.target.value);
    }

    function onValidInputChange(percentage) {
        setErrorMessage('');
        props.onPercentageChange(percentage);
    }

    function onInvalidRatioChange(errorMessage) {
        setErrorMessage(errorMessage);
        props.onPercentageChange(null);
    }

    return (
        <div>
            <h3 style={{ marginTop: '10px' }}>{`${props.title}:`}</h3>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px' }} />
            </div>
            {errorMessage !== '' && <p style={{ color: '#F77', fontSize: '13px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;