import Cookies from 'universal-cookie';

export function ipToInteger(ipStr) {
    var ip = ipStr.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ip) {
        return (+ip[1] << 24) + (+ip[2] << 16) + (+ip[3] << 8) + (+ip[4]);
    }

    return null;
}

export function ipMaskToInteger(maskSize) {
    if (maskSize === 0) {
        return 0;
    }

    return -1 << (32 - maskSize)
}

export function isInteger(str) {
    return /^\d+$/.test(str);
}

export function isIPv4(str) {
    var ipParts = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!ipParts) {
        return false;
    }

    for (const part of ipParts) {
        if (part < 0 || part > 255) {
            return false;
        }
    }

    return true;
}

export function isIPv4Network(str) {
    const subnetParts = str.split('/');
    if (subnetParts.length !== 2) {
        return false;
    }

    if (!isInteger(subnetParts[1])) {
        return false;
    }

    const mask = Number(subnetParts[1]);
    if (mask < 0 || mask > 32) {
        return false;

    }

    if (!isIPv4(subnetParts[0])) {
        return false;
    }

    return true;
}

export function isIpInSubnet(ipInteger, subnetInteger, maskInteger) {
    return (ipInteger & maskInteger) === (subnetInteger & maskInteger);
}

export function isValidFilter(filterString) {
    // Empty filter
    if (filterString === '' || filterString === null) {
        return true;
    }

    const filters = filterString.split(',');
    for (const filter of filters) {
        if (!isIPv4(filter) && !isIPv4Network(filter)) {
            return false;
        }
    }

    return true;
}

export function getStoredFilter(filterType) {
    const cookies = new Cookies();
    const storedFilter = cookies.get(`filter-${filterType}`);
    if (storedFilter === undefined) {
        return null;
    }

    return storedFilter;
}

export function parsePercentage(str) {
    var percentileString = input.replace('%', '');
    return parseFloat(percentileString);
}