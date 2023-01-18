import React, { useState, useEffect } from 'react';
import IpFilter from './IpFilter';
import './Cyber.css'
import { isValidFilter, getStoredFilter } from '../Utils'
import Cookies from 'universal-cookie';

function GraphFilter(props) {

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
        <div className={"user-control-part"} style={{ height: '50%' }} >
            <div style={{ padding: '20px' }}>
                <h4><b>Filter</b></h4>
                <IpFilter filterType={"Inclusions"} onChangeValidInput={(str) => setInclusionString(str)}></IpFilter>
                <br />
                <IpFilter filterType={"Exclusions"} onChangeValidInput={(str) => setExclusionString(str)}></IpFilter>
                <br />
                <button className={"btn-cyber"} onClick={onClickFilter}><b>Filter</b></button>
            </div>
        </div>
    );
}

export default GraphFilter;