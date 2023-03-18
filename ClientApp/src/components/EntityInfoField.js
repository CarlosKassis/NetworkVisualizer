import React from 'react';

function EntityInfoField(props) {

    return (
        <div >
            {
                <div>
                    <p style={{ marginBottom: '10px', fontSize: '1.6vh' }}><b>{props.title}: </b>{props.info == null ? "" : props.info}</p>
                </div>
            }
        </div>
    );
}

export default EntityInfoField;