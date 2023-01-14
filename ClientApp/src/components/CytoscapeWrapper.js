import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    useEffect(() => {
    });

    const cyRef = useRef(null);

    const onNodeClick = (event) => {
        props.onNodeClick(event.target.data().id);
    }

    return (
        <div style={{ width: '80%', backgroundColor: 'FEFEFE' }}>
            <CytoscapeComponent minZoom={0.2} maxZoom={4} wheelSensitivity={0.2} elements={props.graphElements} style={{ height: '75vh' }}
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('tap', 'node', onNodeClick);
                }}
                stylesheet={[
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'background-image': 'data(image)',
                        'background-fit': 'cover',
                        'background-clip': 'none',
                        'background-opacity': 0
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        'width': '1.5px',
                        'line-color': '#999'
                    }
                }
            ]} />
        </div>
    );
}

export default CytoscapeWrapper;