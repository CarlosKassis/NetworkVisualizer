
export function getLiveCaptureDataApi(liveCaptureId, onGetLiveCaptureData) {
    if (liveCaptureId === null) {
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `networkanalyzer/live/data?liveCaptureId=${liveCaptureId}`);

    xhr.onload = () => {
        if (xhr.status == 200) {
            onGetLiveCaptureData(xhr.responseText, false);
        }
        else {
            return null;
            // TODO: reset live capture!!!!!!!
        }
    };

    xhr.send(null);
}

export function startLiveCaptureApi(selectedNic, onStartLiveCaptureResponse) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `networkanalyzer/live/start?nicDesc=${selectedNic}`);

    xhr.onload = () => {
        if (xhr.status == 200) {
            onStartLiveCaptureResponse(xhr.responseText);
        }
    };

    xhr.send(null);
}

export function stopLiveCaptureApi(liveCaptureId) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `networkanalyzer/live/stop?liveCaptureId=${liveCaptureId}`);
    xhr.send(null);
}


export function getNicsApi(onGetNicsResponse) {

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `networkanalyzer/nics`);
    xhr.onload = () => {
        if (xhr.status == 200) {
            onGetNicsResponse(xhr.responseText);
        }
    };

    xhr.send(null);
}