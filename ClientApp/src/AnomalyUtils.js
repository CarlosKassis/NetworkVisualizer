import { entityPairToDictionaryKey } from "./Utils";

// Assumes baseline != null
export function addAnomalousNewConnectionsEdges(elements, finalElements, interactions, baseline, captureStartTime) {

    const newConnections = getNewConnections(baseline, captureStartTime, interactions);
    for (const element of elements.filter(ele1 => isEdge(ele1) && newConnections.has(entityPairToDictionaryKey(ele1.data.source, ele1.data.target)))) {
        element.classes = "edgenewconnection";
        finalElements.push(element);
    }
}

function getNewConnections(baseline, captureStartTime, interactions) {

    const newConnections = new Set();
    for (const interaction of interactions.filter(inter1 => inter1[2] >= captureStartTime + baseline)) {
        newConnections.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
    }

    return newConnections;
}

export function isEdge(element) {
    return element.data.source !== undefined;
}
