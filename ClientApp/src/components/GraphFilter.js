import React from 'react';

// .................... //
// CURRENTLY NOT IN USE //
// .................... //

function GraphFilter(props) {

    return (
        <div style={
            {
                // TODO: code duplication problem between here and EntityInfo
                borderColor: '#555',
                boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)',
                width: '20%',
                backgroundColor: 'white',
                wordWrap: 'break-word',
                maxWidth: '400px',
                marginLeft: '0',
                marginRight: 'auto'
            }
        }>
            <div style={{ margin: '20px', marginTop: '20px' }}>
                <h2 style={{ textAlign: 'center' }} ><b>Filter</b></h2>
            </div>
        </div>
    );
}

export default GraphFilter;