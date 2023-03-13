import React, { useRef, useState, useEffect } from 'react';
import { getStoredFilter, isValidFilter } from '../Utils'

function PercentOrTimeInput(props) {

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

    return (
        <div>
            <h5><b>{`${props.title}:`}</b></h5>
            <div className={"flex-cyber"}>
                <input ref={filterInput} onChange={handleInputChange} style={{ width: '100px' }} />
            </div>
            {validInput ? <br/> : <p style={{ color: '#F77', fontSize: '13px', width: '600px', marginTop: '5px' }}><b>Valid Input: 60% / 50s / 30m / 2.4h / 7.3d ...</b></p>}
        </div>
    );
}

export default PercentOrTimeInput;