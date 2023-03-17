import React, { useState, useEffect, useRef } from 'react';
import FileUploadSingle from './FileUpload'
import CytoscapeWrapper from './CytoscapeWrapper'
import EntityInfo from './EntityInfo';
import GraphFilter from './GraphFilter';
import './Cyber.css'
import { entityPairToDictionaryKey, ipMaskToInteger, ipToInteger, isIpInSubnet, } from '../Utils'
import DropDown from './DropDown';
import { getNicsApi, stopLiveCaptureApi, startLiveCaptureApi, getLiveCaptureDataApi } from '../NetworkAnalyzerApi.js'
import BandwidthChart from './BandwidthChart';
import NewConnections from './NewConnections';
import TrafficIncrease from './TrafficIncrease';
import { addAnomalousNewConnectionsEdges, isEdge } from '../AnomalyUtils';

function Home() {

    const [fullGraphInfo, setFullGraphInfo] = useState({ IsInitial: true, Elements: [] });
    const [newConnectionsBaseline, setNewConnectionsBaseline] = useState(null);
    const [trafficIncreaseBaseline, setTrafficIncreaseBaseline] = useState(null);

    const [entityToData, setEntityToData] = useState(null)
    const liveCapture = useRef({ Id: null, Running: false });
    const interactions = useRef([]);

    const [entityInfo, setEntityInfo] = useState({ ip: null, os: null, mac: null, hostname: null, domain: null, services: null });
    const [subnetFilter, setSubnetFilter] = useState({ inclusion: [], exclusion: [] });
    const [captureLength, setCaptureLength] = useState(60);

    const [nics, setNics] = useState([]);
    const [selectedNic, setSelectedNic] = useState('');
    const [chartData, setChartData] = useState([1]);
    const [selectedInteraction, setSelectedInteraction] = useState({ Valid: false, Entity1: '', Entity2: '' });
    const interactionKeyToData = useRef({});
    const cyRef = useRef(null);

    const EntityType =
    {
        'Gateway': 0,
        'DHCP': 1,
        'DNS': 2,
        'Server': 3,
        'Computer': 4
    };

    useEffect(() => {
        updateBandwidthGraph();
    }, [selectedInteraction])


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
        if (newConnectionsBaseline !== null || trafficIncreaseBaseline !== null) {
            addAnomalousNewConnectionsEdges(filteredElements, filteredAnomalousElements, interactions.current, newConnectionsBaseline, fullGraphInfo.CaptureStartTimestamp);
            cyRef.current.json({ elements: filteredAnomalousElements });
        } else {
            cyRef.current.json({ elements: filteredElements });
        }

        if (fullGraphInfo.IsInitial) {
            cyRef.current.center();
        }

    }, [fullGraphInfo, newConnectionsBaseline, subnetFilter]);

    useEffect(() => {
        getNicsApi((nicsJson) => setNics(JSON.parse(nicsJson)));

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

    function getFilteredGraphElements() {
        return fullGraphInfo.Elements.filter((element) => {
            if (element.data.source) {
                return shouldIpBeDisplayedOnGraph(element.data.source) && shouldIpBeDisplayedOnGraph(element.data.target)
            }

            return shouldIpBeDisplayedOnGraph(element.data.id);
        });
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

    function onFileUpload(json) {
        stopLiveCapture();
        setSelectedInteraction({ Valid: false, Entity1: '', Entity2: '' });
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
            interactionKeyToData.current[entityPairToDictionaryKey(interaction[0][0], interaction[0][1])] = [interaction[1], interaction[2]];
        }

        updateBandwidthGraph();
    }

    const writeEntityDataToEntityInfo = (nodeId) => {
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
        setSelectedInteraction({ Valid: true, Entity1: entity1, Entity2: entity2 })
    }

    function updateBandwidthGraph() {

        if (!selectedInteraction.Valid) {
            setChartData([[0, 0]]);
            return;
        }

        var newChartData = [];

        const bytesPerSeconds = interactionKeyToData.current[entityPairToDictionaryKey(selectedInteraction.Entity1, selectedInteraction.Entity2)][0];
        for (const byteCount of bytesPerSeconds) {
            newChartData.push(byteCount);
        }

        setChartData(newChartData);
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
            setSelectedInteraction({ Valid: false, Entity1: '', Entity2: '' })
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

    function onTrafficIncreaseNewParams(interval, increase) {
        const trafficIncreasements = new Set();

        for (const interaction of interactions.current) {
            // Index = floor((point.x - CaptureStartTime) / Interval)
            const intervalIndexToMaxBPS = {};
            const interactionData = interactionKeyToData.current[entityPairToDictionaryKey(interaction[0][0], interaction[0][1])][0];

            for (const point of interactionData) {
                const time = point[0];
                const intervalIndex = Math.floor((time - fullGraphInfo.CaptureStartTimestamp) / interval);

                if (intervalIndex in intervalIndexToMaxBPS) {
                    intervalIndexToMaxBPS[intervalIndex] = Math.max(point[1], intervalIndexToMaxBPS[intervalIndex]);
                } else {
                    intervalIndexToMaxBPS[intervalIndex] = point[1];
                }
            }

            for (const [intervalIndex, maxBPS] of Object.entries(intervalIndexToMaxBPS)) {
                if ((1 + parseInt(intervalIndex)) in intervalIndexToMaxBPS) {
                    if ((1 + increase) * maxBPS < intervalIndexToMaxBPS[(1 + parseInt(intervalIndex))]) {
                        trafficIncreasements.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
                    }
                }
            }
        }

        const newElements = fullGraphInfo.Elements;
        for (const element of newElements) {
            // Check if is edge
            if (element.data.source !== undefined) {
                if (trafficIncreasements.has(entityPairToDictionaryKey(element.data.source, element.data.target))) {
                    element.classes = "edgetrafficincrease";
                }
                else {
                    element.classes = "edge";
                }
            }
        }
    }

    return (
        <div style={{ fontFamily: 'Arial !important', height: '90vh' }}>

            <div className={"flex-cyber"} style={{ height: 'fit-content' }}>
                <CytoscapeWrapper setCyRef={(cy) => cyRef.current = cy}
                    onNodeClick={writeEntityDataToEntityInfo}
                    onEdgeClick={onEdgeClick}
                />

                <div style={{
                    wordWrap: 'break-word',
                    maxWidth: '400px',
                    height: '100%'
                }}>
                    <EntityInfo entityInfo={entityInfo} />
                    <GraphFilter onFilterGraph={onFilterGraph} />
                    <NewConnections onParamsChange={onNewConnectionsNewBaseline} captureLength={captureLength} onFilterGraph={onFilterGraph} />
                    <TrafficIncrease onParamsChange={onTrafficIncreaseNewParams} captureLength={captureLength} onFilterGraph={onFilterGraph} />
                </div>

                <div className={"flex-cyber"} style={{ height: 'fit-content' }}>

                    <div>
                        <div className={"graph-floating"} style={{ height: 'fit-content' }}>
                            <FileUploadSingle onCallback={onFileUpload} />
                        </div>

                        <div className={"graph-floating"} style={{ height: 'fit-content' }}>
                            <div className={"flex-cyber"}>
                                <button className={"btn-cyber"} onClick={() => startLiveCaptureApi(selectedNic, onStartLiveCaptureResponse)}>Capture</button>
                                <button className={"btn-cyber"} onClick={stopLiveCapture}>Stop</button>
                            </div>
                            <DropDown optionsItems={nics} setSelectedItems={onSelectNic} />
                        </div>
                    </div>

                    <BandwidthChart className={"graph-floating"} chartData={chartData} entity1={selectedInteraction.Entity1} entity2={selectedInteraction.Entity2} />

                </div>
            </div>

        </div>
    );
}

export default Home;