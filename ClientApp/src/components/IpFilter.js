import React, { useState } from 'react';

function IpFilter(props) {

    const [validInput, setValidInput] = useState(true);

    return (
        <div>
            <h5><b>{`${props.title}:`}</b></h5>
            <input style={{ outline: validInput ? 'none' : 'solid', outlineColor: '#F77' }}></input>
            {!validInput && <p style={{ color: '#F77', fontSize: '13px' }}><b>Valid Input: 192.168.1.0/24, 1.1.1.1, ...</b></p>}
        </div>
    );
}

export default IpFilter;