import React, { useState } from 'react';
import { parsePercentage, parseTime } from '../Utils'

function PercentOrTimeInput(props) {

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

            onValidTime(props.maxTime * percentage / 100.0)
            return;
        }

        const time = parseTime(inputString);
        if (!isNaN(time)) {
            if (time <= 0.0001) {
                onInvalidTime('Time must be positive');
                return;
            }

            onValidTime(time);
            return;
        }

        onInvalidTime('Valid Input: 60% / 50s / 30m / 2.4h / 7.3d ...');
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

    function secondsToTimeString(seconds) {
        if (seconds == null) {
            return '0s';
        }

        if (seconds < 60) {
            return `${seconds}s`
        }

        if (seconds < 60 * 60) {
            return `${seconds / (60)}m`
        }

        if (seconds < 60 * 60 * 24) {
            return `${seconds / (60 * 60)}h`
        }

        return `${seconds / (60 * 60 * 24)}d`
    }

    return (
        <div>
            <h5 style={{ marginTop: '10px' }}>{`${props.title}:`}</h5>
            <div className={"flex-cyber"}>
                <input onChange={handleInputChange} style={{ width: '100px', marginTop: '5px' }} />
                <h6 style={{ marginTop: '7px', marginLeft: '10px' }}><b>{`${secondsToTimeString(time)}/${secondsToTimeString(props.maxTime)}`}</b></h6>
            </div>
            {errorMessage == '' ? <br/> : <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>{errorMessage}</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;