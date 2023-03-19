import React, { useRef, useState, useEffect } from 'react';

function PortFilter(props) {

    const [validInput, setValidInput] = useState(true);

    useEffect(() => {

    }, []);

    function handleInputChange(event) {
        props.onChangeValidInput(event.target.value);
    }

    function onKeyDown(event) {
        // 'Enter' key
        if (event.which == 13) {
            props.onSubmitKey();
        }
    }

    return (
        <div>
            <h3 style={{ fontSize: '1.5vh' }}>Services:</h3>
            <input onKeyDown={onKeyDown} style={{ width: '100%', marginBottom: '1vh' }} onChange={handleInputChange}></input>
            {!validInput && <p style={{ color: '#F77', fontSize: '1.5vh' }}><b>HTTP,FTP,...</b></p>}
        </div>
    );
}

export default PortFilter;