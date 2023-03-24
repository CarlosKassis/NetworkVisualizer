import React, { useState, useEffect, useRef } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { entityPairToDictionaryKey, ipMaskToInteger, ipToInteger, isIpInSubnet, } from '../Utils'
import DropDown from './DropDown';
import { getNicsApi, stopLiveCaptureApi, startLiveCaptureApi, getLiveCaptureDataApi } from '../NetworkAnalyzerApi.js'
import NewConnections from './NewConnections';
import TrafficIncrease from './TrafficIncrease';
import { addAnomalousNewConnectionsEdges, addAnomalousTrafficIncreaseEdges, isEdge } from '../AnomalyUtils';
import InteractionInfo from './InteractionInfo';

function Home() {

    const [fullGraphInfo, setFullGraphInfo] = useState({ IsInitial: true, Elements: [] });

    // Anomaly
    const [newConnectionsBaseline, setNewConnectionsBaseline] = useState(null);
    const [trafficIncreaseParams, setTrafficIncreaseParams] = useState(null);

    const [entityToData, setEntityToData] = useState(null)
    const liveCapture = useRef({ Id: null, Running: false });
    const interactions = useRef([]);

    const [entityInfo, setEntityInfo] = useState({ ip: null, os: null, mac: null, hostname: null, domain: null, services: null });
    const [graphFilterParams, setGraphFilterParams] = useState({ inclusion: [], exclusion: [], services: [] });
    const [captureLength, setCaptureLength] = useState(60);

    // NICs
    const [nics, setNics] = useState([]);
    const [selectedNic, setSelectedNic] = useState('');

    const [selectedInteraction, setSelectedInteraction] = useState(null);
    const interactionKeyToData = useRef({});

    // Graph
    const cyRef = useRef(null);

    const EntityType =
    {
        'Gateway': 0,
        'DHCP': 1,
        'DNS': 2,
        'Server': 3,
        'Computer': 4
    };


    ////////////////////////////////////////////////
    /// Main pipeline for showing graph elements ///
    ////////////////////////////////////////////////
    useEffect(() => {
        const filteredElements = getFilteredGraphElements();

        // Reset edge class
        for (const element of filteredElements) {
            if (isEdge(element)) {
                element.classes = "edge";
            }
        }

        // Decide if to display gathered anomalous edges or all edges
        const filteredAnomalousElements = filteredElements.filter(element => !isEdge(element));
        if (newConnectionsBaseline !== null || trafficIncreaseParams !== null) {
            if (newConnectionsBaseline !== null) {
                addAnomalousNewConnectionsEdges(filteredElements, filteredAnomalousElements, interactions.current, newConnectionsBaseline, fullGraphInfo.CaptureStartTimestamp);
            }

            if (trafficIncreaseParams !== null) {
                addAnomalousTrafficIncreaseEdges(filteredElements, filteredAnomalousElements, interactions.current, trafficIncreaseParams.Baseline, trafficIncreaseParams.Increase, fullGraphInfo.CaptureStartTimestamp, fullGraphInfo.CaptureEndTimestamp);
            }

            cyRef.current.json({ elements: filteredAnomalousElements });
        } else {
            cyRef.current.json({ elements: filteredElements });
        }

        if (fullGraphInfo.IsInitial) {
            cyRef.current.center();
        }

    }, [fullGraphInfo, newConnectionsBaseline, graphFilterParams, trafficIncreaseParams]);

    useEffect(() => {

        cyRef.current.on('mousedown', function (evt) {
            setSelectedInteraction(null);
        });

        cyRef.current.on('touchstart', function (evt) {
            setSelectedInteraction(null);
        });

        // Listen for 'Cancel' key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                setSelectedInteraction(null);
            }

            // '`' key
            if (e.keyCode === 192) {
                cyRef.current.center();
            }
        })

        // Query NICs
        getNicsApi((nicsJson) => setNics(JSON.parse(nicsJson)));

        // Setup live capture polling timer
        const intervalId = setInterval(() => {
            if (liveCapture.current.Running) {
                getLiveCaptureDataApi(liveCapture.current.Id, onReceiveNetworkInfoJson);
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

    function onFilterGraph(inclusionString, exclusionString, serviceString) {

        var newSubnetInclusions = [];
        var newSubnetExclusions = [];
        var newServices = (serviceString === null || serviceString === '') ? [] : serviceString.split(',').map((str) => str.trim().toLowerCase());

        tryFillIpFiltersFromString(newSubnetInclusions, inclusionString);
        tryFillIpFiltersFromString(newSubnetExclusions, exclusionString);
 
        setGraphFilterParams({
            "inclusion": newSubnetInclusions,
            "exclusion": newSubnetExclusions,
            "services": newServices
        })
    }

    function getFilteredGraphElements() {
        return fullGraphInfo.Elements.filter((element) => {
            if (element.data.source) {
                if (graphFilterParams.services.length > 0) {
                    const interactionServices = interactionKeyToData.current[entityPairToDictionaryKey(element.data.source, element.data.target)][3];
                    if (!graphFilterParams.services.some((filterService) => {
                        for (const interactionService of interactionServices) {
                            if (interactionService.toLowerCase() == filterService) {
                                return true;
                            }
                        }

                        return false;
                    })) {
                        return false;
                    }
                }

                if (shouldIpBeDisplayedOnGraph(element.data.source) && shouldIpBeDisplayedOnGraph(element.data.target)) {
                    return true;
                }

                if (graphFilterParams.services.size == 0) {
                    return false;
                }

                return false;
            }

            return shouldIpBeDisplayedOnGraph(element.data.id);
        });
    }

    function shouldIpBeDisplayedOnGraph(ip) {

        if (graphFilterParams.exclusion.length > 0) {
            const ipInteger = ipToInteger(ip);
            if (graphFilterParams.exclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        if (graphFilterParams.inclusion.length > 0) {
            const ipInteger = ipToInteger(ip);
            if (!graphFilterParams.inclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        return true;
    }

    function onFileUpload(json) {
        stopLiveCapture();
        setSelectedInteraction(null);
        onReceiveNetworkInfoJson(json);
        setEntityInfoPanelData();
    }

    function onReceiveNetworkInfoJson(json) {
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

        const newFullGraphElements = generateGraphElements(networkInfo);
        interactions.current = networkInfo.Interactions;

        setFullGraphInfo({ IsInitial: fullGraphInfo.Elements.length == 0, Elements: newFullGraphElements, CaptureStartTimestamp: networkInfo.CaptureStartTimestamp, CaptureEndTimestamp: networkInfo.CaptureEndTimestamp });
        interactionKeyToData.current = {};
        for (const interaction of networkInfo.Interactions) {
            interactionKeyToData.current[entityPairToDictionaryKey(interaction[0][0], interaction[0][1])] = interaction;
        }
    }

    const writeEntityDataToEntityInfo = (nodeId) => {
        if (!entityToData || entityToData[nodeId] === undefined) {
            return;
        }

        var entityData = entityToData[nodeId];
        setEntityInfoPanelData(entityData.Ip, entityData.Hostname, entityData.Mac, entityData.Os, entityData.Domain, entityData.Services.join(', '));
    }

    const setEntityInfoPanelData = (ip = null, hostname = null, mac = null, os = null, domain = null, services = null) => {
        setEntityInfo({ "ip": ip, "hostname": hostname, "mac": mac, "os": os, "domain": domain, "services": services })
    }

    // TODO: move to a class
    function generateGraphElements(networkInfo) {

        let elements = []

        for (const entity of networkInfo.Entities) {
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
            if (entityData.Type === null || entityData.Type === EntityType.Computer) {
                icon = '/computer.png';
            }
            else if (entityData.Type === EntityType.Gateway) {
                icon = '/gateway.png';
            }
            else if (entityData.Type === EntityType.DHCP) {
                icon = '/dhcp.png';
            }
            else if (entityData.Type === EntityType.DNS) {
                icon = '/dns.png';
            }
            else if (entityData.Type === EntityType.Server) {
                icon = '/server.png';
            }
            else {
                icon = '/iot.png';
            }

            // Figure label
            let label = entityData.Hostname ? entityData.Hostname : entityData.Ip;

            elements.push({ 'data': { 'id': entityIp, 'label': label, 'image': icon }, 'position': { x: x, y: y } });
        }

        for (const interaction of networkInfo.Interactions) {
            elements.push({ 'data': { 'source': interaction[0][0], 'target': interaction[0][1], 'id': entityPairToDictionaryKey(interaction[0][0], interaction[0][1]) }, 'classes': 'edge' });
        }

        setCaptureLength(networkInfo.CaptureEndTimestamp - networkInfo.CaptureStartTimestamp);

        return elements;
    }


    function onEdgeClick(entity1, entity2) {
        setSelectedInteraction(interactionKeyToData.current[entityPairToDictionaryKey(entity1, entity2)])
    }

    function onSelectNic(nic) {
        setSelectedNic(nic);
    }

    function resetFullGraphInfo() {
        setFullGraphInfo({ IsInitial: true, Elements: [] });
    }

    function onStartLiveCaptureResponse(liveCaptureIdResponse) {
        if (liveCaptureIdResponse !== null) {
            liveCapture.current = { Id: liveCaptureIdResponse, Running: true };
            setSelectedInteraction(null)
            resetFullGraphInfo();
        }
        else {
            // TODO: alert!!
        }
    }

    function stopLiveCapture() {
        stopLiveCaptureApi(liveCapture.current.Id);
        liveCapture.current = { Id: null, Running: false };
    }

    // baseline: integer of seconds 
    function onNewConnectionsNewBaseline(baseline) {
        setNewConnectionsBaseline(baseline);
    }

    function onTrafficIncreaseNewParams(baseline, increase) {
        setTrafficIncreaseParams((baseline === null || increase === null) ? null : { Baseline: baseline, Increase: increase })
    }

    return (
        <div style={{ fontFamily: 'Arial !important', height: '90vh' }}>
            <InteractionInfo interaction={selectedInteraction}></InteractionInfo>
            <div className={"flex-cyber"} style={{ height: 'fit-content' }}>
                <CytoscapeWrapper setCyRef={(cy) => cyRef.current = cy}
                    onNodeClick={writeEntityDataToEntityInfo}
                    onEdgeClick={onEdgeClick}
                />

                <div style={{
                    wordWrap: 'break-word',
                    width: '30vh',
                    height: '100%',
                    marginRight: '20px'
                }}>
                    <EntityInfo entityInfo={entityInfo} />
                    <GraphFilter onFilterGraph={onFilterGraph} />
                    <NewConnections onParamsChange={onNewConnectionsNewBaseline} captureLength={captureLength} onFilterGraph={onFilterGraph} />
                    <TrafficIncrease onParamsChange={onTrafficIncreaseNewParams} captureLength={captureLength} onFilterGraph={onFilterGraph} />
                </div>

                <div className={"flex-cyber"} style={{ height: 'fit-content' }}>
                    <div className={"graph-floating"} style={{ height: 'fit-content' }}>
                        <FileUploadSingle onCallback={onFileUpload} />
                    </div>

                    <div className={"graph-floating"} style={{ height: 'fit-content' }}>
                        <div style={{ marginBottom: '1vh' }} className={"flex-cyber"}>
                            <button className={"btn-cyber"} onClick={() => startLiveCaptureApi(selectedNic, onStartLiveCaptureResponse)}>Capture</button>
                            <button className={"btn-cyber"} onClick={stopLiveCapture}>Stop</button>
                        </div>
                        <DropDown optionsItems={nics} setSelectedItems={onSelectNic} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;