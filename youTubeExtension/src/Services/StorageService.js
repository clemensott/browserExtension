import triggerEvent from '../utils/triggerEvent';

const constants = {
    STORAGE_KEY: '',
    EVENTNAME: 'yotube-extension-storage-service-set',
};

/**
 * A wrapper for the storage interface to enable it for dev enviroment.
 * chrome.storage.sync interface is only available in prd enviroment of options page.
 * This service provides a interface which saves the data in the localStorage
 */
export default class StorageService {
    constructor() {
        document.addEventListener(constants.EVENTNAME, this.onSetData.bind(this));
    }

    onSetData({ detail }) {
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(detail);
        } else {
            const storedData = JSON.parse(localStorage.getItem(constants.STORAGE_KEY) || '{}');
            localStorage.setItem(constants.STORAGE_KEY, JSON.stringify({
                ...storedData,
                ...detail,
            }));
        }
    }

    set(obj) {
        triggerEvent(constants.EVENTNAME, obj);
    }

    get(keys) {
        console.log('storage get:', !!(chrome && chrome.storage && chrome.storage.sync), keys);
        if (chrome && chrome.storage && chrome.storage.sync) {
            return new Promise(resolve => {
                chrome.storage.sync.get(keys, resolve);
            });
        }

        const storedData = JSON.parse(localStorage.getItem(constants.STORAGE_KEY) || '{}');
        const result = Object.entries(keys).reduce((obj, [key, defaultValue]) => {
            obj[key] = key in storedData ? storedData[key] : defaultValue;
            return obj;
        }, {});
        return result;
    }
}