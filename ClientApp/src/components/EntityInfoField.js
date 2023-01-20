import React from 'react';

function EntityInfoField(props) {

    return (
        <div >
            {
                <div>
                    <h5 style={{ paddingBottom: '15px' }}><b>{props.title}: </b>{props.info == null ? "" : props.info}</h5>
                </div>
            }
        </div>
    );
}

export default EntityInfoField;