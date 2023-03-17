import React, { useState, useEffect } from 'react';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'

function NewConnections(props) {

    const [baseline, setBaseline] = useState(null);

    useEffect(() => {
        props.onParamsChange(baseline);
    }, [props.captureLength, baseline]);

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '300px' }} >
            <h4><b>New Connections</b></h4>
            <PercentOrTimeInput captureLength={props.captureLength} title={"Baseline [%,s,m,h,d]"} onTimeChange={(time) => setBaseline(time)}></PercentOrTimeInput>
        </div>
    );
}

export default NewConnections;