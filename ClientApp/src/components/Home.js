import React, { useState, useEffect, useRef } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { ipMaskToInteger, ipToInteger, isIpInSubnet, } from '../Utils'
import DropDown from './DropDown';
import { getNicsApi, stopLiveCaptureApi, startLiveCaptureApi, getLiveCaptureDataApi } from '../NetworkAnalyzerApi.js'
import BandwidthChart from './BandwidthChart';

function Home() {

    const [graphElements, setGraphElements] = useState([]); // Is a full/filtered fullGraphElements
    const [fullGraphElements, setFullGraphElements] = useState([]);
    const [entityToData, setEntityToData] = useState(null)
    const liveCaptureId = useRef(null);
    const isLiveCapturing = useRef(false);
    const interactions = useRef([]);

    const [entityInfo, setEntityInfo] = useState({ "ip": null, "os": null, "mac": null, "hostname": null, "domain": null, "services": null });
    const [subnetFilter, setSubnetFilter] = useState({ "inclusion": [], "exclusion": [] });
    const [resetNetworkView, setResetNetworkView] = useState(true);
    const [nics, setNics] = useState([]);
    const [selectedNic, setSelectedNic] = useState('');
    const [chartData, setChartData] = useState([1]);
    const [selectedInteraction, setSelectedInteraction] = useState({"entity1": '', "entity2": ''});

    const EntityType = 
    {
        'Gateway': 0,
        'DHCP': 1,
        'DNS': 2,
        'Server': 3,
        'Computer': 4
    };

    useEffect(() => {
        applyFilteringAndSetGraphElements();
    }, [fullGraphElements, subnetFilter]);

    useEffect(() => {
        getNicsApi((nicsJson) => setNics(JSON.parse(nicsJson)));
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (isLiveCapturing.current) {
                getLiveCaptureDataApi(liveCaptureId.current, onReceiveNetworkInfoJson);
            }
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

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
        if (!entityToData || entityToData[nodeId] === undefined) {
            return;
        }

        var entityData = entityToData[nodeId];
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

        var index = 0;
        for (const interaction of networkInfo.Interactions) {
            elements.push({ 'data': { 'source': interaction[0][0], 'target': interaction[0][1], 'index': index }, 'classes': 'edge' });
            index++;
        }

        interactions.current = networkInfo.Interactions;

        return elements;
    }

    function updateBandwidthGraph(interactionIndex) {
        var newChartData = [];
        setSelectedInteraction({ "entity1": interactions.current[interactionIndex][0][0], "entity2": interactions.current[interactionIndex][0][1] })
        var bytesPerSeconds = interactions.current[interactionIndex][1]
        for (const byteCount of bytesPerSeconds) {
            newChartData.push(byteCount);
        }

        setChartData(newChartData);
    }

    function onSelectNic(nic) {
        setSelectedNic(nic);
    }

    function onStartLiveCaptureResponse(liveCaptureIdResponse) {
        if (liveCaptureIdResponse !== null) {
            liveCaptureId.current = liveCaptureIdResponse;
            isLiveCapturing.current = true;
        }
        else {
            // TODO: alert!!
        }
    }

    function stopLiveCapture() {
        stopLiveCaptureApi(liveCaptureId.current);
        liveCaptureId.current = null;
        isLiveCapturing.current = false;
    }

    return (
        <div style={{ fontFamily: 'Arial !important', height: '90vh' }}>

            <div className={"flex-cyber"} style={{
                height: '100%'
            }}>
                <CytoscapeWrapper resetNetworkView={resetNetworkView} graphElements={graphElements}
                    onNodeClick={writeEntityDataToEntityInfo}
                    onEdgeClick={updateBandwidthGraph}
                />
                <div className={"flex-cyber"} style={{ height: 'fit-content' } }>
                    <div className={"graph-floating"}>
                        <FileUploadSingle onCallback={onFileUpload} />
                    </div>

                    <div className={"graph-floating"}>
                        <div className={"flex-cyber"}>
                            <button className={"btn-cyber"} onClick={() => startLiveCaptureApi(selectedNic, onStartLiveCaptureResponse)}>Capture</button>
                            <button className={"btn-cyber"} onClick={stopLiveCapture}>Stop</button>
                        </div>
                        <DropDown optionsItems={nics} setSelectedItems={onSelectNic} />
                    </div>
                </div>
                <div style={{
                    borderColor: '#555',
                    backgroundColor: 'white',
                    wordWrap: 'break-word',
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: '0px',
                    height: '100%'
                }}>
                    <EntityInfo entityInfo={entityInfo} />
                    <GraphFilter onFilterGraph={onFilterGraph} />
                </div>
            </div>
        </div>
    );
}

export default Home;