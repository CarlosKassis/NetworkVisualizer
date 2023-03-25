import React, { useEffect, useState } from 'react';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'
import PercentInput from './PercentInput';

function TrafficIncrease(props) {

    const [baseline, setBaseline] = useState(null);
    const [increase, setIncrease] = useState(null);

    useEffect(() => {
        props.onParamsChange(baseline, increase);
    }, [props.captureLength, baseline, increase]);

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '100%' }} >
            <h3 className={"graph-control-title"}><b>Traffic Increase</b></h3>
            <PercentInput captureLength={props.captureLength} title={"Baseline [%,s,m,h,d]"} onPercentageChange={(percentage) => setBaseline(percentage)}></PercentInput>
            <PercentInput title={"Increase [%]"} onPercentageChange={(percentage) => setIncrease(percentage)}></PercentInput>
        </div>
    );
}

export default TrafficIncrease;