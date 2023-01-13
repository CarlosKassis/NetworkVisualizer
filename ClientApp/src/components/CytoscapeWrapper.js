import React, { useState, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    useEffect(() => {
    });

    return (
        
        <div style={{ borderColor: '#555', borderStyle: 'solid', width: '100%' }}>
            <CytoscapeComponent minZoom={0.2} maxZoom={2} elements={props.graphElements} style={{ width: '100%', height: '70vh' }} stylesheet={[
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'background-image': 'data(image)',
                        'background-fit': 'cover',
                        'background-clip': 'none',
                        'background-opacity': 0
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': '2px',
                        'line-color': '#999'
                    }
                }
            ]} />
        </div>
    );
}

export default CytoscapeWrapper;