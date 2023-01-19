import React, { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    const cyRef = useRef(null);

    useEffect(() => {
        cyRef.current.center();
    }, [props.resetNetworkView]);

    const onNodeClick = (event) => {
        props.onNodeClick(event.target.data().id);
    }

    const defaultElements = { 'data': { 'id': '0.0.0.0', 'label': 'PC', 'image': '/computer.png' } };
    return (
        <div style={{ width: '100%', backgroundColor: 'FEFEFE' }}>
            <CytoscapeComponent minZoom={0.01} maxZoom={8} style={{ height: '100%' }}
                elements={props.graphElements.length ? props.graphElements : [defaultElements]}
                textureOnViewport={true} // Set true for larger graphs to make moving graph around faster
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('tap', 'node', onNodeClick)
                }}
                stylesheet={[
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'background-image': 'data(image)',
                            'background-fit': 'cover',
                            'background-clip': 'none',
                            'background-opacity': 0,
                            'width': '50px',
                            'height': '50px'
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