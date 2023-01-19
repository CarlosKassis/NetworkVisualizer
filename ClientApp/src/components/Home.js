import React, { useState, useEffect, useRef } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { ipMaskToInteger, ipToInteger, isIpInSubnet, } from '../Utils'
import DropDown from './DropDown';

function Home() {

    const [graphElements, setGraphElements] = useState([]); // Is a full/filtered fullGraphElements
    const [fullGraphElements, setFullGraphElements] = useState([]);
    const [entityToData, setEntityToData] = useState(null)
    const liveCaptureId = useRef(null);

    const [entityInfo, setEntityInfo] = useState({ "ip": null, "os": null, "mac": null, "hostname": null, "domain": null, "services": null });
    const [subnetFilter, setSubnetFilter] = useState({ "inclusion": [], "exclusion": [] });
    const [pollLiveCapture, setPollLiveCapture] = useState(false);
    const [resetNetworkView, setResetNetworkView] = useState(true);
    const [nics, setNics] = useState([]);
    const [selectedNic, setSelectedNic] = useState('');
    const [isLiveCapturing, setIsLiveCapturing] = useState(false);

    const EntityType = 
    {
        'Gateway': 0,
        'DHCP': 1,
        'DNS': 2,
        'Server': 3,
        'Computer': 4
    };

    // Filter after changing graph elements
    useEffect(() => {
        applyFilteringAndSetGraphElements();
    }, [fullGraphElements, subnetFilter]);



    useEffect(() => {

        // Get NICs
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `networkanalyzer/nics`);
        xhr.onload = () => {
            if (xhr.status == 200) {
                const nicsArray = JSON.parse(xhr.responseText);
                setNics(nicsArray);
            }
        };
        xhr.send(null);

    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            tryGetLiveCaptureJson();
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);


    function startLiveCapture() {
        const xhr = new XMLHttpRequest();
        console.log(selectedNic);
        xhr.open('POST', `networkanalyzer/live/start?nicDesc=${selectedNic}`);

        xhr.onload = () => {
            if (xhr.status == 200) {
                liveCaptureId.current = xhr.responseText;
                setIsLiveCapturing(true);
            }
        };

        xhr.send(null);
    }

    function stopLiveCapture() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `networkanalyzer/live/stop?liveCaptureId=${liveCaptureId.current}`);

        xhr.onload = () => {
            if (xhr.status == 200) {
                liveCaptureId.current = null;
                setIsLiveCapturing(false);
            }
        };

        xhr.send(null);
    }

    function tryGetLiveCaptureJson() {
        console.log("t3theer")
        if (liveCaptureId.current === null) {
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `networkanalyzer/live/data?liveCaptureId=${liveCaptureId.current}`);

        xhr.onload = () => {
            if (xhr.status == 200) {
                onReceiveNetworkInfoJson(xhr.responseText)
            }
            else {
                // TODO: reset live capture!!!!!!!
            }
        };

        xhr.send(null);
    }

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

    useEffect(() => {
        setEntityInfoPanelData();
    }, [resetNetworkView]);

    function onFileUpload(json) {
        onReceiveNetworkInfoJson(json);
        setResetNetworkView(true);
    }

    function onReceiveNetworkInfoJson(json)
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

        setEntityInfoPanelData(entityData.Ip, entityData.Hostname, entityData.Mac, entityData.Os, entityData.Domain, entityData.Services.join(','));
    }

    const setEntityInfoPanelData = (ip = null, hostname = null, mac = null, os = null, domain = null, services = null) => {
        setEntityInfo({ "ip": ip, "hostname": hostname, "mac": mac, "os": os, "domain": domain, "services": services })
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

                // Bug
                if (entityPosition !== undefined) {
                    x = entityPosition[0];
                    y = entityPosition[1];
                }
            }

            // Figure icon
            let icon = null;
            // TODO: use enums
            if (entityData.Type === null || entityData.Type === EntityType.Computer)
            {
                icon = '/computer.png';
            }
            else if (entityData.Type === EntityType.Gateway)
            {
                icon = '/gateway.png';
            }
            else if (entityData.Type === EntityType.DHCP)
            {
                icon = '/dhcp.png';
            }
            else if (entityData.Type === EntityType.DNS)
            {
                icon = '/dns.png';
            }
            else if (entityData.Type === EntityType.Server)
            {
                icon = '/server.png';
            }
            else
            {
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

    function onSelectNic(nic) {
        console.log(nic);
        setSelectedNic(nic);
    }

    return (
        <div style={{ fontFamily: 'Arial !important' }}>
            <div className={"container"} >
                <h2 style={{ textAlign: 'center', marginBottom:'40px' }}>Traffic Analysis</h2>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    height: '75px'
                }}>
                    <div style={{width:'50%'} }>
                        <FileUploadSingle onCallback={onFileUpload} />
                        <br />
                    </div>
                    <div>
                        <div style={{
                            width: '50%', display: 'flex', flexDirection: 'row'
                        }}>
                            <button onClick={startLiveCapture}>Capture</button>
                            <button onClick={stopLiveCapture}>Stop</button>
                        </div>
                        <DropDown optionsItems={nics} setSelectedItems={onSelectNic} />
                    </div>

                </div>
            </div>
            <div style={{
                height: '75vh',
                display: 'flex',
                flexDirection: 'row',
                boxShadow: '0px 10px 20px 0 rgb(0 0 0 /60%)'
            }}>
                <CytoscapeWrapper resetNetworkView={resetNetworkView} graphElements={graphElements} onNodeClick={writeEntityDataToEntityInfo} />
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
                    <EntityInfo entityInfo={entityInfo} />
                    <GraphFilter onFilterGraph={onFilterGraph} />
                </div>
            </div>
        </div>
    );
}

export default Home;