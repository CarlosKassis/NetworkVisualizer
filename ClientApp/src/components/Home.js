import React, { useState } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';

function Home() {

    const [graphElements, setGraphElements] = useState([]);
    const [entityToData, setEntityToData] = useState(null)

    const [ip, setIp] = useState(null);
    const [os, setOs] = useState(null);
    const [mac, setMac] = useState(null);
    const [hostname, setHostname] = useState(null);
    const [domain, setDomain] = useState(null);

    const fileUploadCallback = (json) =>
    {
        const networkInfo = JSON.parse(json);
        if (!networkInfo) {
            // TODO: show error
            return;
        }
        var entityDictionary = {};
        for (const entity of networkInfo.Entities) {
            entityDictionary[entity[0]] = entity[1];
        }

        setEntityToData(entityDictionary);
        setGraphElements(generateGraphElements(networkInfo));
    }

    const writeEntityDataToEntityInfo = (nodeId) =>
    {
        alert(JSON.stringify(nodeId));
        if (!entityToData) {
            return;
        }

        let entityData = entityToData[nodeId];

        setIp(entityData.Ip);
        setHostname(entityData.Hostname);
        setMac(entityData.Mac);
        setOs(entityData.Os);
        setDomain(entityData.Domain);
    }

    const serviceNamesThatMakeYouAServer = ["HTTP", "HTTPS", "DNS", "DHCP"]

    // TODO: move to a class
    const generateGraphElements = (networkInfo) => {

        let elements = []
        var entityCount = networkInfo.Entities.length;
        var squareWidth = Math.floor(Math.sqrt(entityCount));

        var i = 0;
        for (const entity of networkInfo.Entities)
        {
            var entityData = entity[1];

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

            var entityIp = entity[0]
            elements.push({ 'data': { 'id': entityIp, 'label': entityIp, 'image': icon }, 'position': { x: x, y: y } });
            i++;
        }

        for (const interaction of networkInfo.Interactions) {

            elements.push({ 'data': { 'source': interaction[0], 'target': interaction[1] }, 'classes': 'edge' });
        }

        return elements;
    }


    return (
        <div>
            <div className={"container"}>
                <h1>Traffic Analysis</h1>
                <br />
                <FileUploadSingle onCallback={fileUploadCallback} />
                <br />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)' }}>
                <CytoscapeWrapper graphElements={graphElements} onNodeClick={(e) => writeEntityDataToEntityInfo(e)} />
                <EntityInfo ip={ip} hostname={hostname} os={os} mac={mac} domain={domain} />
            </div>
        </div>
    );
}

export default Home;