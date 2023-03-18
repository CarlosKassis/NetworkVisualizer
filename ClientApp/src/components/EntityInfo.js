import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div className={"user-control-part graph-floating"} style={{ width: '100%', height: '100%'}} >
            <EntityInfoField title={"IP address"} info={props.entityInfo.ip} />
            <EntityInfoField title={"Hostname"} info={props.entityInfo.hostname} />
            <EntityInfoField title={"MAC address"} info={props.entityInfo.mac} />
            <EntityInfoField title={"OS"} info={props.entityInfo.os} />
            <EntityInfoField title={"Domain"} info={props.entityInfo.domain} />
            <EntityInfoField title={"Services"} info={props.entityInfo.services} />
        </div>
    );
}

export default EntityInfo;