import React, { useRef } from 'react';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'
import Cookies from 'universal-cookie';
import PercentInput from './PercentInput';

function TrafficIncrease(props) {

    const interval = useRef(null);
    const increase = useRef(null);

    function onClickFind() {
        if (interval.current === null || increase.current === null) {
            return;
        }

        props.onSubmit(interval.current, increase.current);
    }

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '300px' }} >
            <h4><b>Traffic Increase</b></h4>
            <PercentOrTimeInput captureLength={props.captureLength} title={"Interval [%,s,m,h,d]"} onInputChange={(time) => interval.current = time}></PercentOrTimeInput>
            <PercentInput title={"Change [%]"} onInputChange={(ratio) => increase.current = ratio}></PercentInput>
            <button className={"btn-cyber"} onClick={onClickFind}><b>Find</b></button>
        </div>
    );
}

export default TrafficIncrease;