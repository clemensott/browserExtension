import { navigationChange } from '../constants';
import getCurrentVideoId from '../utils/getCurrentVideoId';
import triggerEvent from '../utils/triggerEvent';

const constants = {
    URL_CHANGE_EVENTNAME: 'NavigationEventService.urlChange',
};

function checkValue(tabs, value) {
    return Array.isArray(tabs) ? tabs.includes(value) : tabs === value;
}

function mergeStates(currentState, lastState) {
    if (currentState && lastState) return navigationChange.STAYED;
    if (currentState && !lastState) return navigationChange.ENTERED;
    if (!currentState && lastState) return navigationChange.LEFT;
    return navigationChange.NONE;
}

function createArgs(state, last) {
    const args = {};
    Object.entries(last).forEach(([key, lastValue]) => {
        args[key] = mergeStates(state[key], lastValue);
    });
    return args;
}

let instance = null;

export default class NavigationEventService {
    constructor() {
        this.intervalId = null;
        this.lastUrl = null;
        this.lastState = {
            isVideoWatchSite: false,
            isChannelSite: false,
            isChannelVideosSite: false,
        };

        this.onTick = this.onTick.bind(this);
    }

    static getInstance() {
        if (!instance) {
            instance = new NavigationEventService();
        }
        return instance;
    }

    static isVideoWatchSite() {
        return !!getCurrentVideoId();
    }

    static isChannelVideosSite() {
        return NavigationEventService.isChannelSite('videos');
    }

    static isChannelSite(tab = null) {
        const channelMatchList = ['c', 'channel', 'user'];
        const mismatchList = ['watch', 'shorts', 'playlist', 'feed', 'premium ', 'results', ''];
        const channelTabs = ['featured', 'videos', 'playlists', 'community', 'store', 'channels', 'about'];

        const pathParts = window.location.pathname.split('/');
        switch (pathParts.length) {
            case 2:
                return !tab && !mismatchList.includes(pathParts[1]);

            case 3:
                return (!tab && channelMatchList.includes(pathParts[1])) ||
                    (!mismatchList.includes(pathParts[1]) && checkValue(tab || channelTabs, pathParts[2]));

            case 4:
                return channelMatchList.includes(pathParts[1]) && checkValue(tab || channelTabs, pathParts[3]);

            default:
                return false;
        }
    }

    start() {
        this.stop();
        this.intervalId = setInterval(this.onTick, 20);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    onTick() {
        if (this.lastUrl !== window.location.href) {
            this.onUrlChange();
        }
    }

    onUrlChange() {
        const state = {
            isVideoWatchSite: NavigationEventService.isVideoWatchSite(),
            isChannelSite: NavigationEventService.isChannelSite(),
            isChannelVideosSite: NavigationEventService.isChannelVideosSite(),
        };
        triggerEvent(constants.URL_CHANGE_EVENTNAME, createArgs(state, this.lastState));

        this.lastState = state;
        this.lastUrl = window.location.href;
    }

    addOnUrlChangeEventHandler(callback) {
        document.addEventListener(constants.URL_CHANGE_EVENTNAME, callback);
    }

    removeOnUrlChangeEventHandler(callback) {
        document.removeEventListener(constants.URL_CHANGE_EVENTNAME, callback);
    }
}
