import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div className={"user-control-part"} style={{ height: '50%' }} >
            <div style={{ padding: '20px' }}>
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