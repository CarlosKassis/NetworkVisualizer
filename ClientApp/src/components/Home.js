import React, { useState, useEffect } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { ipMaskToInteger, ipToInteger, isIpInSubnet, } from '../Utils'

function Home() {

    const [graphElements, setGraphElements] = useState([]); // Is a full/filtered fullGraphElements
    const [fullGraphElements, setFullGraphElements] = useState([]);
    const [entityToData, setEntityToData] = useState(null)

    const [entityInfo, setEntityInfo] = useState({ "ip": null, "os": null, "mac": null, "hostname": null, "domain": null });
    const [subnetFilter, setSubnetFilter] = useState({ "inclusion":[], "exclusion":[]});

    // Filter after changing graph elements
    useEffect(() => {
        applyFilteringAndSetGraphElements();
    }, [fullGraphElements, subnetFilter]);

    function tryFillIpFiltersFromString(filterList, filterString) {
        if (filterString === '' || filterString === null) {
            return;
        }

        const filters = filterString.split(',');
        for (const filter of filters) {
            if (filter.includes('/')) {
                const subnetParts = filter.split('/');
                const maskInteger = ipMaskToInteger(Number(subnetParts[1]));
                filterList.push([ipToInteger(subnetParts[0]) & maskInteger, maskInteger])
            }
            else {
                filterList.push([ipToInteger(filter), ipMaskToInteger(32)]);
            }
        }
    }

    function onFilterGraph(inclusionString, exclusionString) {

        var newSubnetInclusions = [];
        var newSubnetExclusions = [];

        tryFillIpFiltersFromString(newSubnetInclusions, inclusionString);
        tryFillIpFiltersFromString(newSubnetExclusions, exclusionString);

        setSubnetFilter({
            "inclusion": newSubnetInclusions,
            "exclusion": newSubnetExclusions
        })
    }

    function applyFilteringAndSetGraphElements() {

        const filteredGraphElements = fullGraphElements.filter((element) => {
            if (element.data.source) {
                return shouldIpBeDisplayedOnGraph(element.data.source) && shouldIpBeDisplayedOnGraph(element.data.target)
            }

            return shouldIpBeDisplayedOnGraph(element.data.id);
        });

        setGraphElements(filteredGraphElements);
    }

    function shouldIpBeDisplayedOnGraph(ip) {
        
        if (subnetFilter.exclusion.length > 0) {
            const ipInteger = ipToInteger(ip);
            if (subnetFilter.exclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        if (subnetFilter.inclusion.length > 0) {
            const ipInteger = ipToInteger(ip);
            if (!subnetFilter.inclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        return true;
    }

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

        const graphElements = generateGraphElements(networkInfo);
        setFullGraphElements(graphElements);
    }

    const writeEntityDataToEntityInfo = (nodeId) =>
    {
        if (!entityToData) {
            return;
        }

        var entityData = entityToData[nodeId];
        if (entityData === undefined) {
            return;
        }

        setEntityInfoPanelData(entityData.Ip, entityData.Hostname, entityData.Mac, entityData.Os, entityData.Domain);
    }

    const setEntityInfoPanelData = (ip = null, hostname = null, mac = null, os = null, domain = null) => {
        setEntityInfo({ "ip": ip, "hostname": hostname, "mac": mac, "os": os, "domain": domain })
    }

    // TODO: move to a class
    const generateGraphElements = (networkInfo) => {

        let elements = []

        for (const entity of networkInfo.Entities)
        {
            if (entity[0] === null || entity[1] === null) {
                continue;
            }

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
                <CytoscapeWrapper graphElements={graphElements} onNodeClick={writeEntityDataToEntityInfo} />
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
                    <EntityInfo ip={entityInfo["ip"]} hostname={entityInfo["hostname"]} os={entityInfo["os"]} mac={entityInfo["mac"]} domain={entityInfo["domain"]} />
                    <GraphFilter onFilterGraph={onFilterGraph} />
                </div>
            </div>
        </div>
    );
}

export default Home;