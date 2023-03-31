
const EntityType =
{
    'Gateway': 0,
    'DHCP': 1,
    'DNS': 2,
    'Server': 3,
    'Computer': 4
};

export function generateGraphElements(networkInfo, entityPairToDictionaryKey) {

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

            // Patch
            if (entityPosition) {
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

    return elements;
}