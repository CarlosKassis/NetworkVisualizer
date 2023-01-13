import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div style={{ borderColor: '#555', borderStyle: 'solid', width: '400px' }}>
            <div style={{ margin: '20px' }}>
                <EntityInfoField title={"IP address"} info={props.ip} />
                <EntityInfoField title={"Hostname"} info={props.hostname} />
                <EntityInfoField title={"MAC address"} info={props.mac} />
                <EntityInfoField title={"OS"} info={props.os} />
                <EntityInfoField title={"Domain"} info={props.domain} />
            </div>
        </div>
    );
}

export default EntityInfo;