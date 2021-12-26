import triggerEvent from '../utils/triggerEvent';

const eventName = 'initDataService.ondata';

export default class InitDataService {
    constructor() {
    }

    send(name, data) {
        triggerEvent(eventName, {
            name,
            data,
        });
    }

    addOnDataListener(callback) {
        document.addEventListener(eventName, callback);
    }

    removeOnDataListener(callback) {
        document.removeEventListener(eventName, callback);
    }
}