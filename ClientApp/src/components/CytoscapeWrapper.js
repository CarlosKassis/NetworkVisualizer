import React, { useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function CytoscapeWrapper(props) {

    useEffect(() => {
    });

    const handleCyRef = (cy) => {
        cy.on('tap', 'node', (event) => {
          alert('Node tapped: ' + event.target.id());
        });
    }

    return (
        <div style={{ width: '80%', backgroundColor: 'FEFEFE' } }>
            <CytoscapeComponent minZoom={0.2} maxZoom={4} elements={props.graphElements} style={{ height: '75vh' }}
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