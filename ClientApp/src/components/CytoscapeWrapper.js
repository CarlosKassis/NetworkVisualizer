import React, { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    const cyRef = useRef(null);

    const onNodeClick = (event) => {
        props.onNodeClick(event.target.data().id);
    }

    const onEdgeClick = (event) => {
        props.onEdgeClick(event.target.data().source, event.target.data().target);
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'FEFEFE',
            position: 'absolute',
            zIndex:'1'
        }}>
            <CytoscapeComponent minZoom={0.01} maxZoom={8} style={{ height: '100vh' }}
                textureOnViewport={true} // Set true for larger graphs to make moving graph around faster
                cy={(cy) => {
                    props.setCyRef(cy);
                    cyRef.current = cy;
                    cy.on('tap', 'node', onNodeClick)
                    cy.on('tap', 'edge', onEdgeClick)
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