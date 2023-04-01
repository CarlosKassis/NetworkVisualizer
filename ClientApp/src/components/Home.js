import React, { useState, useEffect, useRef } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { entityPairToDictionaryKey, ipToInteger, isIpInSubnet, tryFillIpFiltersFromString } from '../Utils'
import DropDown from './DropDown';
import { getNicsApi, stopLiveCaptureApi, startLiveCaptureApi, getLiveCaptureDataApi } from '../NetworkAnalyzerApi.js'
import NewConnections from './NewConnections';
import TrafficIncrease from './TrafficIncrease';
import { addAnomalousNewConnectionsEdges, addAnomalousTrafficIncreaseEdges, isEdge } from '../AnomalyUtils';
import InteractionInfo from './InteractionInfo';
import { generateGraphElements } from '../GraphUtils';

function Home() {

    const [fullGraphInfo, setFullGraphInfo] = useState({ Elements: [] });
    const [graphCentered, setGraphCentered] = useState(false);

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

    ////////////////////////////////////////////////
    /// Main pipeline for showing graph elements ///
    ////////////////////////////////////////////////
    useEffect(() => {
        const filteredElements = getFilteredGraphElements();

        if (selectedInteraction !== null) {
            setSelectedInteraction(interactionKeyToData.current[entityPairToDictionaryKey(selectedInteraction[0][0], selectedInteraction[0][1])])
        }

        // Reset edge class
        for (const element of filteredElements) {
            if (isEdge(element)) {
                element.classes = "edge";
            }
        }

        // Decide if to display gathered anomalous edges or all edges
        if (newConnectionsBaseline !== null || trafficIncreaseParams !== null) {
            const filteredAnomalousElements = filteredElements.filter(element => !isEdge(element));
            if (newConnectionsBaseline !== null) {
                addAnomalousNewConnectionsEdges(filteredElements, filteredAnomalousElements, interactions.current, newConnectionsBaseline, fullGraphInfo.CaptureStartTimestamp, fullGraphInfo.CaptureEndTimestamp);
            }

            if (trafficIncreaseParams !== null) {
                addAnomalousTrafficIncreaseEdges(filteredElements, filteredAnomalousElements, interactions.current, trafficIncreaseParams.Baseline, trafficIncreaseParams.Increase);
            }
            cyRef.current.json({ elements: filteredAnomalousElements });
        } else {
            cyRef.current.json({ elements: filteredElements });
        }


        if (!graphCentered && fullGraphInfo.Elements.length) {
            cyRef.current.center();
            setGraphCentered(true);
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
            if (!element.data.source) {
                return shouldIpBeDisplayedOnGraph(element.data.id);
            }

            if (graphFilterParams.services.length) {
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

            return shouldIpBeDisplayedOnGraph(element.data.source) && shouldIpBeDisplayedOnGraph(element.data.target);
        });
    }

    function shouldIpBeDisplayedOnGraph(ip) {

        if (graphFilterParams.exclusion.length) {
            const ipInteger = ipToInteger(ip);
            if (graphFilterParams.exclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        if (graphFilterParams.inclusion.length) {
            const ipInteger = ipToInteger(ip);
            if (!graphFilterParams.inclusion.some((subnet) => isIpInSubnet(ipInteger, subnet[0], subnet[1]))) {
                return false;
            }
        }

        return true;
    }

    function onFileUpload(json) {
        stopLiveCapture();
        resetFullGraphInfo();
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

        const newFullGraphElements = generateGraphElements(networkInfo, entityPairToDictionaryKey);
        interactions.current = networkInfo.Interactions;

        setCaptureLength(networkInfo.CaptureEndTimestamp - networkInfo.CaptureStartTimestamp);

        setFullGraphInfo({ Elements: newFullGraphElements, CaptureStartTimestamp: networkInfo.CaptureStartTimestamp, CaptureEndTimestamp: networkInfo.CaptureEndTimestamp });
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


    function onEdgeClick(entity1, entity2) {
        setSelectedInteraction(interactionKeyToData.current[entityPairToDictionaryKey(entity1, entity2)])
    }

    function onSelectNic(nic) {
        setSelectedNic(nic);
    }

    function resetFullGraphInfo() {
        setFullGraphInfo({ Elements: [] });
        setGraphCentered(false);
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