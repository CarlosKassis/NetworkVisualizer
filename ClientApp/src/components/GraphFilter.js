import React, { useState, useEffect } from 'react';
import IpFilter from './IpFilter';
import './Cyber.css'
import { isValidFilter, getStoredFilter } from '../Utils'
import Cookies from 'universal-cookie';
import PortFilter from './PortFilter';

function GraphFilter(props) {

    const [inclusionString, setInclusionString] = useState('');
    const [exclusionString, setExclusionString] = useState('');
    const [serviceString, setServiceString] = useState('');

    // Run once on load
    useEffect(() => {
        const storedInclusions = getStoredFilter("Inclusions")
        const storedExclusions = getStoredFilter("Exclusions")
        const storedServices = getStoredFilter("Services")

        if (storedInclusions !== null) {
            setInclusionString(storedInclusions);
        }

        if (storedExclusions !== null) {
            setExclusionString(storedExclusions);
        }

        if (storedServices !== null) {
            setServiceString(storedServices);
        }

        onFilter(storedInclusions, storedExclusions, storedServices, false);
    }, []);

    function onClickFilter() {
        onFilter(inclusionString, exclusionString, serviceString);
    }

    function onFilter(inclusionStringParam, exclusionStringParam, serviceStringParam, storeCookies = true) {
        if (!isValidFilter(inclusionStringParam) || !isValidFilter(exclusionStringParam)) {
            return;
        }

        if (storeCookies) {
            const cookies = new Cookies();
            cookies.set(`filter-Inclusions`, inclusionStringParam, { path: '/' });
            cookies.set(`filter-Exclusions`, exclusionStringParam, { path: '/' });
            cookies.set(`filter-Services`, exclusionStringParam, { path: '/' });
        }

        props.onFilterGraph(inclusionStringParam, exclusionStringParam, serviceStringParam)
    }

    function onSubmitKey(event) {
        onClickFilter();
    }

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '100%' }} >
            <h3 className={"graph-control-title"}><b>Filter</b></h3>
            <IpFilter onSubmitKey={onSubmitKey } filterType={"Inclusions"} onChangeValidInput={(str) => setInclusionString(str)}></IpFilter>
            <IpFilter onSubmitKey={onSubmitKey} filterType={"Exclusions"} onChangeValidInput={(str) => setExclusionString(str)}></IpFilter>
            <PortFilter onSubmitKey={onSubmitKey} onChangeValidInput={(str) => setServiceString(str)}></PortFilter>
            <button className={"btn-cyber"} onClick={onClickFilter}><b>Filter</b></button>
        </div>
    );
}

export default GraphFilter;