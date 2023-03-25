import React, { useState, useEffect } from 'react';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'

function NewConnections(props) {

    const [baseline, setBaseline] = useState(null);

    useEffect(() => {
        props.onParamsChange(baseline);
    }, [props.captureLength, baseline]);

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '100%' }} >
            <h3 className={"graph-control-title"}><b>New Connections</b></h3>
            <PercentOrTimeInput captureLength={props.captureLength} title={"Baseline [%,s,m,h,d]"} onInputChange={(input) => setBaseline(input)}></PercentOrTimeInput>
        </div>
    );
}

export default NewConnections;