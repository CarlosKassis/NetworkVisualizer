import React from 'react';

function EntityInfoField(props) {

    return (
        <div>
            <h5><b>{props.title}: </b>{props.info == null ? "Unkown" : props.info}</h5>
            <br />
        </div>
    );
}

export default EntityInfoField;