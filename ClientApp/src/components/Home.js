import React, { useState } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'

function Home() {

    const [graphElements, setGraphElements] = useState([]);

    const fileUploadCallback = (json) => {
        setGraphElements(generateGraphElements(json))
    }

    const generateGraphElements = (graphJson) => {
        let elements = []
        if (!graphJson) {
            return []
        }
        const graph = JSON.parse(graphJson);

        var entityCount = graph.Entities.length;
        var squareWidth = Math.floor(Math.sqrt(entityCount))
        
        for (var i = 0; i < entityCount; i++)
        {
            elements.push({ data: { id: graph.Entities[i], label: graph.Entities[i] }, position: { x: (i % squareWidth) * 100, y: Math.floor(i / squareWidth) * 100 } });
        }

        var edgeCount = graph.Edges.length;
        for (var i = 0; i < edgeCount; i++) {

            elements.push({ 'data': { 'source': graph.Edges[i][0], 'target': graph.Edges[i][1] }, 'classes': 'edge' });
        }

        return elements;
    }


    return (
        <div>
        <h1>Traffic Analysis</h1>
        <br/>
            <FileUploadSingle onCallback={fileUploadCallback} />
        <br/>
            <CytoscapeWrapper graphElements={graphElements} />
        </div>
    );
}

export default Home;