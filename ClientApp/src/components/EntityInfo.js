import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div className={"user-control-part"} style={{ height: '50%' }} >
            <div style={{ padding: '20px' }}>
                <EntityInfoField title={"IP address"} info={props.entityInfo.ip} />
                <EntityInfoField title={"Hostname"} info={props.entityInfo.hostname} />
                <EntityInfoField title={"MAC address"} info={props.entityInfo.mac} />
                <EntityInfoField title={"OS"} info={props.entityInfo.os} />
                <EntityInfoField title={"Domain"} info={props.entityInfo.domain} />
                <EntityInfoField title={"Services"} info={props.entityInfo.services} />
            </div>
        </div>
    );
}

export default EntityInfo;