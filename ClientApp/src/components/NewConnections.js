import React, { useState, useEffect } from 'react';
import IpFilter from './IpFilter';
import PercentOrTimeInput from './PercentOrTimeInput';
import './Cyber.css'
import { isValidFilter, getStoredFilter } from '../Utils'
import Cookies from 'universal-cookie';

function NewConnections(props) {

    const [inclusionString, setInclusionString] = useState('');
    const [exclusionString, setExclusionString] = useState('');

    // Run once on load
    useEffect(() => {
        const storedInclusions = getStoredFilter("Inclusions")
        const storedExclusions = getStoredFilter("Exclusions")

        if (storedInclusions !== null) {
            setInclusionString(storedInclusions);
        }

        if (storedExclusions !== null) {
            setExclusionString(storedExclusions);
        }

        onFilter(storedInclusions, storedExclusions, false);
    }, []);

    function onClickFilter() {
        onFilter(inclusionString, exclusionString);
    }

    function onFilter(inclusionStringParam, exclusionStringParam, storeCookies = true) {
        if (!isValidFilter(inclusionStringParam) || !isValidFilter(exclusionStringParam)) {
            return;
        }

        if (storeCookies) {
            const cookies = new Cookies();
            cookies.set(`filter-Inclusions`, inclusionStringParam, { path: '/' });
            cookies.set(`filter-Exclusions`, exclusionStringParam, { path: '/' });
        }

        props.onFilterGraph(inclusionStringParam, exclusionStringParam)
    }

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '300px' }} >
            <h4><b>New Connections</b></h4>
            <PercentOrTimeInput maxTime={3 * 24 * 3600} title={"Baseline [%,s,m,h,d]"} onChangeValidInput={(str) => setInclusionString(str)}></PercentOrTimeInput>
            <button className={"btn-cyber"} onClick={onClickFilter}><b>Find</b></button>
        </div>
    );
}

export default NewConnections;