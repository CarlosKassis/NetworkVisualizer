import React from 'react';
import EntityInfoField from './EntityInfoField';

function EntityInfo(props) {

    return (
        <div style={
            {
                borderColor: '#555',
                boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)',
                width: '20%',
                backgroundColor: 'white',
                wordWrap: 'break-word',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: '0px'
            }
        }>
            <div style={{ margin: '20px', marginTop: '40px' }}>
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