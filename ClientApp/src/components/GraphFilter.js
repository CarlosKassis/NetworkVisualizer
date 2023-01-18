import React, { useState } from 'react';
import IpFilter from './IpFilter';
import './Cyber.css'
import Cookies from 'universal-cookie';

function GraphFilter(props) {

    const [inclusionString, setInclusionString] = useState('');
    const [exclusionString, setExclusionString] = useState('');
    const [filterValidity, setFilterValidity] = useState(true);

    function onClickFilter() {
        if (!filterValidity) {
            return;
        }

        const cookies = new Cookies();
        cookies.set(`filter-Inclusions`, inclusionString, { path: '/' });
        cookies.set(`filter-Exclusions`, exclusionString, { path: '/' });

        props.onFilterGraph(inclusionString, exclusionString)
    }

    return (
        <div style={
            {
                // TODO: code duplication problem between here and EntityInfo
                borderColor: '#555',
                width: '100%',
                height: '50%',
                wordWrap: 'break-word',
                outline: 'solid',
                outlineColor: '#EEE'
            }
        }>
            <div style={{ padding: '20px' }}>
                <h4><b>Filter</b></h4>
                <IpFilter filterType={"Inclusions"} onChangeValidInput={(str) => setInclusionString(str)} setFilterValidity={(validity) => setFilterValidity(validity)}></IpFilter>
                <br />
                <IpFilter filterType={"Exclusions"} onChangeValidInput={(str) => setExclusionString(str)} setFilterValidity={(validity) => setFilterValidity(validity)}></IpFilter>
                <br />
                <button className={"btn-cyber"} onClick={onClickFilter}><b>Filter</b></button>
            </div>
        </div>
    );
}

export default GraphFilter;