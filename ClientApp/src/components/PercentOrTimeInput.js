import React, { useEffect, useState } from 'react';
import { parsePercentage, parseTime } from '../Utils'

// Component that takes percentage (needs props.captureLength) or time input from field and returns time in seconds ('50%'*1m/'30s' => 30)
function PercentOrTimeInput(props) {

    const [errorMessage, setErrorMessage] = useState('');
    const [input, setInput] = useState(null);
    const [percentOrTime, setPercentOrTime] = useState(null);

    useEffect(() => {
        if (input == null || input == '') {
            onInputChangeInvalid('');
            return;
        }

        const percentage = parsePercentage(input);
        if (!isNaN(percentage)) {
            if (percentage <= 0.0001 || percentage >= 100.0) {
                onInputChangeInvalid('Valid percentage: 0% < P < 100%');
                return;
            }

            onInputChangeValid({ Percentage: percentage, TimeInSeconds: null });
            return;
        }

        const timeInSeconds = parseTime(input);
        if (!isNaN(timeInSeconds)) {
            if (timeInSeconds <= 0.0001) {
                onInputChangeInvalid('Time must be positive');
                return;
            }

            onInputChangeValid({ Percentage: null, TimeInSeconds: timeInSeconds });
            return;
        }

        onInputChangeInvalid('Valid Input: 60% / 50s / 30m / 2.4h / 7.3d ...');
    }, [input, props.captureLength])

    function handleInputChange(event) {
        setInput(event.target.value);
    }

    function onInputChangeValid(input) {
        setErrorMessage('');
        props.onInputChange(input);
        setPercentOrTime(input);
    }

    function onInputChangeInvalid(errorMessage) {
        setErrorMessage(errorMessage);
        props.onInputChange(null);
        setPercentOrTime(null);
    }

    function timeInSecondsToString(timeInSeconds) {
        if (timeInSeconds < 60) {
            return `${numberToPrettyString(timeInSeconds)}s`
        }

        if (timeInSeconds < 60 * 60) {
            return `${numberToPrettyString(timeInSeconds / 60)}m`
        }

        if (timeInSeconds < 60 * 60 * 24) {
            return `${numberToPrettyString(timeInSeconds / (60 * 60))}h`
        }

        return `${numberToPrettyString(timeInSeconds / (60 * 60 * 24))}d`
    }

    function timeDisplay() {
        if (percentOrTime === null) {
            return `?/${timeInSecondsToString(props.captureLength)}`
        }

        if (percentOrTime.Percentage !== null) {
            return `${timeInSecondsToString(props.captureLength * (percentOrTime.Percentage / 100.0))}/${timeInSecondsToString(props.captureLength)}`
        }

        if (percentOrTime.TimeInSeconds !== null) {
            return `${timeInSecondsToString(percentOrTime.TimeInSeconds)}/${timeInSecondsToString(props.captureLength)}`
        }
    }

    function numberToPrettyString(number) {
        if (`${number}`.includes('.')) {
            return `${number.toFixed(1)}`;
        }

        return `${number}`;
    }

    return (
        <div>
            <h3 style={{ marginTop: '10px' }}>{`${props.title}:`}</h3>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px', marginTop: '5px' }} />
                <h3 style={{ marginTop: '7px', marginLeft: '10px' }}>{timeDisplay()}</h3>
            </div>
            {errorMessage !== '' && <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;