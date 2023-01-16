import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div style={
            {
                width: '100%',
                height: '50%',
                wordWrap: 'break-word',
                outline: 'solid',
                outlineColor: '#EEE'
            }
        }>
            <div style={{padding: '20px'} }>
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