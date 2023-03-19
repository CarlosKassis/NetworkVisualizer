import React, { useRef, useState, useEffect } from 'react';
import { getStoredFilter, isValidFilter } from '../Utils'

function IpFilter(props) {

    const [validInput, setValidInput] = useState(true);
    const [initilized, setInitialized] = useState(false);
    const filterInput = useRef();


    // Initialization
    useEffect(() => {
        if (initilized) {
            return;
        }

        setInitialized(true);

        const storedFilter = getStoredFilter(props.filterType);
        if (storedFilter !== null) {
            if (isValidFilter(storedFilter)) {
                filterInput.current.value = storedFilter;
                props.onChangeValidInput(storedFilter);
                setValidInput(true);
                return;
            }

            setValidInput(false);
            return;
        }

        setValidInput(true);
    }, [initilized]);

    function handleInputChange(event) {

        const filterString = event.target.value;
        if (isValidFilter(filterString)) {
            props.onChangeValidInput(filterString);
            setValidInput(true);
            return;
        }

        setValidInput(false);
    }

    function onKeyDown(event) {
        // 'Enter' key
        if (event.which == 13) {
            props.onSubmitKey();
        }
    }

    return (
        <div>
            <h3 style={{ fontSize: '1.5vh' }}>{`${props.filterType}:`}</h3>
            <input onKeyDown={onKeyDown } style={{ width: '100%', marginBottom: '1vh' }} ref={filterInput} onChange={handleInputChange}></input>
            {!validInput && <p style={{ color: '#F77', fontSize: '1.25vh' }}><b>Valid Input: 192.168.1.0/24, 1.1.1.1, ...</b></p>}
        </div>
    );
}

export default IpFilter;