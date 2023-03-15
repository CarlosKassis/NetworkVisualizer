import React, { useRef } from 'react';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'

function NewConnections(props) {

    const baseline = useRef(null);

    function onClickFind() {
        if (baseline.current == null) {
            return;
        }

        props.onSubmit(baseline.current);
    }

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '300px' }} >
            <h4><b>New Connections</b></h4>
            <PercentOrTimeInput captureLength={props.captureLength} title={"Baseline [%,s,m,h,d]"} onInputChange={(time) => baseline.current = time}></PercentOrTimeInput>
            <button className={"btn-cyber"} onClick={onClickFind}><b>Find</b></button>
        </div>
    );
}

export default NewConnections;