import React, { useEffect, useState } from 'react';
import { parsePercentage, parseTime } from '../Utils'

function PercentOrTimeInput(props) {

    const [errorMessage, setErrorMessage] = useState('');
    const [input, setInput] = useState(null);
    const [displayTime, setDisplayTime] = useState('');

    useEffect(() => {
        if (input == null || input == '') {
            onInputChangeInvalid('');
            return;
        }

        const percentage = parsePercentage(input);
        if (!isNaN(percentage)) {
            if (percentage <= 0.0001 || percentage > 100.0) {
                onInputChangeInvalid('Valid percentage: 0% < P <= 100%');
                return;
            }

            onInputChangeValid(props.captureLength * percentage / 100.0)
            return;
        }

        const time = parseTime(input);
        if (!isNaN(time)) {
            if (time <= 0.0001) {
                onInputChangeInvalid('Time must be positive');
                return;
            }

            onInputChangeValid(time);
            return;
        }

        onInputChangeInvalid('Valid Input: 60% / 50s / 30m / 2.4h / 7.3d ...');
    }, [input, props.captureLength])

    function handleInputChange(event) {
        setInput(event.target.value);
    }

    function onInputChangeValid(time) {
        setErrorMessage('');
        props.onTimeChange(time);
        setDisplayTime(time);
    }

    function onInputChangeInvalid(errorMessage) {
        setErrorMessage(errorMessage);
        props.onTimeChange(null);
        setDisplayTime('');
    }

    function secondsToTimeString(seconds) {
        if (seconds == null) {
            return '0s';
        }

        if (seconds < 60) {
            return `${numberToPrettyString(seconds)}s`
        }

        if (seconds < 60 * 60) {
            return `${numberToPrettyString(seconds / 60)}m`
        }

        if (seconds < 60 * 60 * 24) {
            return `${numberToPrettyString(seconds / (60 * 60))}h`
        }

        return `${numberToPrettyString(seconds / (60 * 60 * 24))}d`
    }

    function numberToPrettyString(number) {
        if (`${number}`.includes('.')) {
            return `${number.toFixed(1)}`;
        }

        return `${number}`;
    }

    return (
        <div>
            <h5 style={{ marginTop: '10px' }}>{`${props.title}:`}</h5>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px', marginTop: '5px' }} />
                <h6 style={{ marginTop: '7px', marginLeft: '10px' }}>
                    <b>{`${secondsToTimeString(displayTime)}/${secondsToTimeString(props.captureLength)}`}</b>
                </h6>
            </div>
            {errorMessage == '' ? <br/> : <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;