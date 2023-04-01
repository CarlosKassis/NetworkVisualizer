import { entityPairToDictionaryKey } from "./Utils";

// Assumes baseline != null
export function addAnomalousNewConnectionsEdges(elements, finalElements, interactions, baseline, captureStartTime, captureEndTime) {
    const newConnections = getNewConnectionsElements(baseline, captureStartTime, captureEndTime, interactions);
    for (const element of elements.filter(ele1 => isEdge(ele1) && newConnections.has(entityPairToDictionaryKey(ele1.data.source, ele1.data.target)))) {
        element.classes = "edgenewconnection";
        finalElements.push(element);
    }
}

export function addAnomalousTrafficIncreaseEdges(elements, finalElements, interactions, baseline, increase) {
    const newConnections = getTrafficIncreaseElements(baseline, increase, interactions);
    for (const element of elements.filter(ele1 => isEdge(ele1) && newConnections.has(entityPairToDictionaryKey(ele1.data.source, ele1.data.target)))) {
        element.classes = "edgetrafficincrease";
        finalElements.push(element);
    }
}

export function isEdge(element) {
    return element.data.source !== undefined;
}

function getNewConnectionsElements(baseline, captureStartTime, captureEndTime, interactions) {
    var baselineTimeInSeconds;
    if (baseline.Percentage !== null) {
        baselineTimeInSeconds = (captureEndTime - captureStartTime) * (baseline.Percentage) / 100.0;
    } else {
        baselineTimeInSeconds = baseline.TimeInSeconds;
    }

    const newConnections = new Set();
    for (const interaction of interactions.filter(inter1 => inter1[2] >= captureStartTime + baselineTimeInSeconds)) {

        // Patch
        if (interaction[2] >= captureEndTime) {
            continue;
        }

        newConnections.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
    }

    return newConnections;
}

function getTrafficIncreaseElements(baseline, increase, interactions) {

    const trafficIncreasements = new Set();
    for (const interaction of interactions) {
        var maxBpsBaseline = null, maxBpsAfterBaseline = null;
        if (interaction[1].length <= 1) {
            continue;
        }

        const baselineOfInteractionTime = (interaction[1][interaction[1].length - 1][0] - interaction[1][0][0]) * (baseline / 100.0);
        const firstPacketTimestamp = interaction[1][0][0];
        for (const point of interaction[1]) {
            if (point[0] - firstPacketTimestamp < baselineOfInteractionTime) {
                maxBpsBaseline = maxBpsBaseline == null ? point[1] : Math.max(maxBpsBaseline, point[1]);
            } else {
                maxBpsAfterBaseline = maxBpsAfterBaseline == null ? point[1] : Math.max(maxBpsAfterBaseline, point[1]);
            }
        }

        if (maxBpsBaseline === null || maxBpsAfterBaseline === null) {
            continue;
        }

        if (maxBpsBaseline * (1 + (increase / 100.0)) <= maxBpsAfterBaseline) {
            trafficIncreasements.add(entityPairToDictionaryKey(interaction[0][0], interaction[0][1]))
            console.log(interaction);
            console.log(maxBpsBaseline + ' , ' + maxBpsAfterBaseline);
        }
    }

    return trafficIncreasements;
}