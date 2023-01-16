import React, { useState, useEffect } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'

function Home() {

    const [graphElements, setGraphElements] = useState([]); // Is a full/filtered fullGraphElements
    const [fullGraphElements, setFullGraphElements] = useState([]);
    const [entityToData, setEntityToData] = useState(null)

    const [ip, setIp] = useState(null);
    const [os, setOs] = useState(null);
    const [mac, setMac] = useState(null);
    const [hostname, setHostname] = useState(null);
    const [domain, setDomain] = useState(null);
    const [needToRecenter, setNeedToRecenter] = useState(false);

    useEffect(() => {
        setNeedToRecenter(false);
    });

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
        setEntityInfoPanelData()
        var elements = generateGraphElements(networkInfo);

        // A WORKING FILTERING :DDDD
        /*elements = elements.filter((element) => {
            return element.data.id && !ipStartsWithOne(element.data.id)
                || element.data.source && !ipStartsWithOne(element.data.source) && !ipStartsWithOne(element.data.target) 
        })*/

        
        setGraphElements(elements);
        setFullGraphElements(elements);
        setNeedToRecenter(true);
    }

    const writeEntityDataToEntityInfo = (nodeId) =>
    {
        if (!entityToData) {
            return;
        }

        let entityData = entityToData[nodeId];
        setEntityInfoPanelData(entityData.Ip, entityData.Hostname, entityData.Mac, entityData.Os, entityData.Domain);
    }

    const setEntityInfoPanelData = (ip = null, hostname = null, mac = null, os = null, domain = null) => {

        setIp(ip);
        setHostname(hostname);
        setMac(mac);
        setOs(os);
        setDomain(domain);
    }

    // TODO: move to a class
    const generateGraphElements = (networkInfo) => {

        let elements = []

        for (const entity of networkInfo.Entities)
        {
            let entityIp = entity[0]
            let entityData = entity[1];
            let x = 0;
            let y = 0;

            if (networkInfo.EntityPositions != null) {
                let entityPosition = networkInfo.EntityPositions[entityIp]
                x = entityPosition[0];
                y = entityPosition[1];
            }

            // Figure icon
            let icon = null;
            // TODO: use enums
            if (!entityData.Type || entityData.Type === "Computer") {
                icon = '/computer.png';
            } else if (entityData.Type === "Server") {
                icon = '/server.png';
            } else {
                icon = '/iot.png';
            }

            // Figure label
            let label = entityData.Hostname ? entityData.Hostname : entityData.Ip;

            elements.push({ 'data': { 'id': entityIp, 'label': label, 'image': icon }, 'position': { x: x, y: y } });
        }

        for (const interaction of networkInfo.Interactions) {
            elements.push({ 'data': { 'source': interaction[0], 'target': interaction[1] }, 'classes': 'edge' });
        }

        return elements;
    }

    return (
        <div style={{ fontFamily: 'Arial !important' }}>
            <div className={"container"} >
                <h2>Traffic Analysis</h2>
                <FileUploadSingle onCallback={fileUploadCallback} />
                <br />
            </div>
            <div style={{
                height: '75vh',
                display: 'flex',
                flexDirection: 'row',
                boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)'
            }}>
                <CytoscapeWrapper needToRecenter={needToRecenter} graphElements={graphElements} onNodeClick={(e) => writeEntityDataToEntityInfo(e)}
                style={{
                    width: '70%'
                }} />
                <div style={{
                    borderColor: '#555',
                    boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)',
                    width: '30%',
                    backgroundColor: 'white',
                    wordWrap: 'break-word',
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: '0px'
                }}>
                    <EntityInfo ip={ip} hostname={hostname} os={os} mac={mac} domain={domain} />
                    <GraphFilter />
                </div>
            </div>
        </div>
    );
}

export default Home;