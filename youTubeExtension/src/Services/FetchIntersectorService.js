import triggerEvent from '../utils/triggerEvent';

const originalFetch = window.fetch;
const eventName = 'fetchIntersect.onfetchtext';

async function handleFetchPromise(promise) {
    const response = await promise;

    if (response.ok) {
        const textPromise = response.text();
        response.text = () => textPromise;
        try {
            const text = await textPromise;
            triggerEvent(eventName, {
                url: response.url,
                text,
            });
        } catch (e) {
            console.error(e)
        }
    }
}

function fetchWrapper(...params) {
    const promise = originalFetch(...params);
    handleFetchPromise(promise);
    return promise;
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