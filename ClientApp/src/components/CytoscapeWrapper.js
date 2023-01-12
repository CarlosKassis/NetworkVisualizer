import React, { useState, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    useEffect(() => {
    });

    return (
        
        <div style={{ borderColor: '#555', borderStyle: 'solid', width: '100%' }}>
            <CytoscapeComponent minZoom={0.05} maxZoom={2} elements={props.graphElements} style={{ width: '100%', height: '70vh' }} />
        </div>
    );
}

export default CytoscapeWrapper;