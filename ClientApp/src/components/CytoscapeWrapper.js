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

    const defaultElements = { 'data': { 'id': '0.0.0.0', 'label': 'PC', 'image': '/computer.png' } };

    return (
        <div style={{ width: '80%', backgroundColor: 'FEFEFE' }}>
            <CytoscapeComponent minZoom={0.01} maxZoom={8} style={{ height: '75vh' }}
                elements={props.graphElements.length ? props.graphElements : [defaultElements] }
                textureOnViewport={true} // Set true for larger graphs to make moving graph around faster
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.center();
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
                        'line-color': '#777'
                    }
                }
            ]} />
        </div>
    );
}

export default CytoscapeWrapper;