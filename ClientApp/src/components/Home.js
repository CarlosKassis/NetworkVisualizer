import React, { useState } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';

function Home() {

    const [graphElements, setGraphElements] = useState([]);

    const [ip, setIp] = useState(null);
    const [os, setOs] = useState(null);
    const [mac, setMac] = useState(null);
    const [hostname, setHostname] = useState(null);
    const [domain, setDomain] = useState(null);

    const fileUploadCallback = (json) => {
        setGraphElements(generateGraphElements(json));
    }

    const writeEntityDataToEntityInfo = (node) =>
    {
        alert("aaaa");
        /*this.setState({
            ip: entityData.Ip,
            hostname: entityData.Hostname,
            mac: entityData.Mac,
            os: entityData.Os,
            domain: entityData.Domain
        });*/
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
            <div class={"container"}>
                <h1>Traffic Analysis</h1>
                <br />
                <FileUploadSingle onCallback={fileUploadCallback} />
                <br />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)' }}>
                <CytoscapeWrapper graphElements={graphElements} />
                <EntityInfo ip={ip} hostname={hostname} os={os} mac={mac} domain={domain} />
            </div>
        </div>
    );
}

export default Home;