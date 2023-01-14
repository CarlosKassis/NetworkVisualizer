import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import cise from 'cytoscape-cise';
Cytoscape.use(cise);

function CytoscapeWrapper(props) {

    useEffect(() => {
    });

    const cyRef = useRef(null);

    const onNodeClick = (event) => {
        props.onNodeClick(event.target.data().id);
    }

    const defaultElements = { 'data': { 'id': '0.0.0.0', 'label': 'PC', 'image': '/computer.png' }, 'position': { x: 0, y: 0 } };

    return (
        <div style={{ width: '80%', backgroundColor: 'FEFEFE' }}>
            <CytoscapeComponent minZoom={0.1} maxZoom={8} wheelSensitivity={0.2} style={{ height: '75vh' }}
                elements={props.graphElements.length ? props.graphElements : [defaultElements] }
                textureOnViewport={false} // Set true for larger graphs to make moving graph around faster
                layout={
                    {
                        name:'circle'
                    }
                }
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