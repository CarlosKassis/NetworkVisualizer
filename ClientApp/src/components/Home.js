import React, { useState } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'

function Home() {

    const [graphElements, setGraphElements] = useState([]);

    const fileUploadCallback = (json) => {
        setGraphElements(generateGraphElements(json));
    }

    const serviceNamesThatMakeYouAServer = ["HTTP", "HTTPS", "DNS", "DHCP"]

    // TODO: move to a class
    const generateGraphElements = (graphJson) => {
        let elements = []
        if (!graphJson) {
            return [];
        }

        const graph = JSON.parse(graphJson);

        var entityCount = graph.Entities.length;
        var squareWidth = Math.floor(Math.sqrt(entityCount));

        for (var i = 0; i < entityCount; i++)
        {
            var entityData = graph.Entities[i][1]

            var icon = '/computer.png';
            var x = (i % squareWidth) * 100;
            var y = Math.floor(i / squareWidth) * 100;
            for (const service of entityData.Services)
            {
                if (service == "SNMP") {
                    icon = '/iot.png'
                    break;
                }

                var foundAServerService = false;
                for (const serviceThatMakesYouAServer of serviceNamesThatMakeYouAServer)
                {
                    if (serviceThatMakesYouAServer == service)
                    {
                        icon = '/server.png'
                        foundAServerService = true;
                        break;
                    }
                }

                if (foundAServerService)
                {
                    break;
                }
            }

            var entityIp = graph.Entities[i][0]
            elements.push({ data: { id: entityIp, label: entityIp, image: icon }, position: { x: x, y: y } });
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