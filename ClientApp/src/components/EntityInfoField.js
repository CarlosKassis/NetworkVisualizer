import React from 'react';

function EntityInfoField(props) {

    return (
        <div>
            { props.info != null &&
                <div>
                    <h5><b>{props.title}: </b>{props.info == null ? "" : props.info}</h5>
                    <br />
                </div>
            }
        </div>
    );
}

export default EntityInfoField;