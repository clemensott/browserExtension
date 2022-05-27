import triggerEvent from '../utils/triggerEvent';

const originalFetch = window.fetch;
const eventName = 'fetchIntersect.onfetchtext';

async function getText(response) {
    const text = await response.text();
    try {
        triggerEvent(eventName, {
            url: response.url,
            text,
        });
    } catch (e) {
        console.error('fetch wrapper text error', e);
    }
    return text;
}

async function getJSON(response) {
    const json = await response.json();
    try {
        triggerEvent(eventName, {
            url: response.url,
            json,
        });
    } catch (e) {
        console.error('fetch wrapper json error', e);
    }
    return json;
}

function proxyHandler(target, prop) {
    let res;
    switch (prop) {
        case 'text':
            res = () => getText(target);
            break;
        case 'json':
            res = () => getJSON(target);
            break;
        default:
            res = target[prop];
            break;
    }
    return res;
}

async function fetchWrapper(...params) {
    const response = await originalFetch(...params);
    return new Proxy(response, { get: proxyHandler });
}

class FetchIntersectorService {
    constructor() {
    }

    enable() {
        window.fetch = fetchWrapper;
        console.log('enable fetch intersector');
    }

    disable() {
        window.fetch = originalFetch;
    }

    addOnTextListener(callback) {
        document.addEventListener(eventName, callback);
    }

    removeOnTextListener(callback) {
        document.removeEventListener(eventName, callback);
    }
}

export default new FetchIntersectorService();