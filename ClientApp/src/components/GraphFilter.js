import React from 'react';
import IpFilter from './IpFilter';
import './Cyber.css'

function GraphFilter(props) {

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
                <IpFilter title={"Inclusions"}></IpFilter>
                <IpFilter title={"Exclusions"}></IpFilter>
                <button className={"btn-cyber"} style={{

                }}><b>Filter</b></button>
            </div>
        </div>
    );
}

export default GraphFilter;