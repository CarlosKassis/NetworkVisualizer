import { entityPairToDictionaryKey } from "./Utils";

// Assumes baseline != null
export function addAnomalousNewConnectionsEdges(elements, finalElements, interactions, baseline, captureStartTime) {
    const newConnections = getNewConnectionsElements(baseline, captureStartTime, interactions);
    for (const element of elements.filter(ele1 => isEdge(ele1) && newConnections.has(entityPairToDictionaryKey(ele1.data.source, ele1.data.target)))) {
        element.classes = "edgenewconnection";
        finalElements.push(element);
    }
}

export function addAnomalousTrafficIncreaseEdges(elements, finalElements, interactions, baseline, increase, captureStartTime) {
    console.log(baseline + ' ' + increase)
    const newConnections = getTrafficIncreaseElements(baseline, increase, captureStartTime, interactions);
    for (const element of elements.filter(ele1 => isEdge(ele1) && newConnections.has(entityPairToDictionaryKey(ele1.data.source, ele1.data.target)))) {
        element.classes = "edgetrafficincrease";
        finalElements.push(element);
    }
}

export function isEdge(element) {
    return element.data.source !== undefined;
}

function getNewConnectionsElements(baseline, captureStartTime, interactions) {

    const newConnections = new Set();
    for (const interaction of interactions.filter(inter1 => inter1[2] >= captureStartTime + baseline)) {
        newConnections.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
    }

    return newConnections;
}

function getTrafficIncreaseElements(baseline, increase, captureStartTime, interactions) {

    const trafficIncreasements = new Set();
    for (const interaction of interactions) {
        var maxBpsBaseline = 0, maxBpsAfterBaseline = 0;
        if (interaction[1].length <= 1) {
            return trafficIncreasements;
        }

        for (const point of interaction[1]) {
            if (point[0] - captureStartTime < baseline) {
                maxBpsBaseline = Math.max(maxBpsBaseline, point[1]);
            } else {
                maxBpsAfterBaseline = Math.max(maxBpsAfterBaseline, point[1]);
            }
        }

        if (maxBpsBaseline * (1 + increase) <= maxBpsAfterBaseline) {
            trafficIncreasements.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
        }
    }

    return trafficIncreasements;
}