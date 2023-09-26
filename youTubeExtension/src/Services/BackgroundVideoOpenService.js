import { openVideoType } from '../constants';
import getPlaylistIdFromUrl from '../utils/getPlaylistIdFromUrl';
import getVideoIdFromUrl from '../utils/getVideoIdFromUrl';

const constants = {
    LAST_TAB_STATES_KEY: 'LAST_TABS_STATE',
};

function getUrlsFromBookmarkTreeNodes(nodes) {
    const urls = [];
    nodes.forEach(node => {
        if (node.url) {
            urls.push(node.url);
        }
        if (node.children) {
            urls.push(...getUrlsFromBookmarkTreeNodes(node.children));
        }
    });
    return urls;
}

async function getBookmarkVideoIds() {
    const tree = await chrome.bookmarks.getTree();
    const allUrls = getUrlsFromBookmarkTreeNodes(tree);
    return allUrls.map(getVideoIdFromUrl).filter(Boolean);
}

function getOpenVideos(tabState) {
    const { videoId, discarded, playlistVideoIds } = tabState;
    const openVideos = [];
    if (videoId) {
        openVideos.push({
            videoId,
            type: discarded ? openVideoType.DISCARDED : openVideoType.WATCH,
        });
    }
    if (playlistVideoIds) {
        openVideos.push(...playlistVideoIds.map(id => ({
            videoId: id,
            type: openVideoType.PLAYLIST,
        })));
    }
    return openVideos;
}

async function getOpenYoutubeTabIds() {
    const openTabs = await chrome.tabs.query({
        discarded: false,
        url: 'https://www.youtube.com/*',
    });
    return openTabs.map(t => t.id);
}

export default class BackgroundVideoOpenService {
    constructor(storageService, messagesService) {
        this.storageService = storageService;
        this.messagesService = messagesService;

        this.onRequestOpenVideos = this.onRequestOpenVideos.bind(this);
        this.onLocalOpenVideosChange = this.onLocalOpenVideosChange.bind(this);
        this.onTabUpdated = this.onTabUpdated.bind(this);
        this.onTabRemoved = this.onTabRemoved.bind(this);
        this.onBookmarkChanged = this.onBookmarkChanged.bind(this);
    }

    start() {
        this.messagesService.onRequestOpenVideos(this.onRequestOpenVideos);
        this.messagesService.onLocalOpenVideosChange(this.onLocalOpenVideosChange);
        chrome.tabs.onUpdated.addListener(this.onTabUpdated);
        chrome.tabs.onRemoved.addListener(this.onTabRemoved);

        chrome.bookmarks.onCreated.addListener(this.onBookmarkChanged);
        chrome.bookmarks.onChanged.addListener(this.onBookmarkChanged);
        chrome.bookmarks.onRemoved.addListener(this.onBookmarkChanged);
    }

    async getLastTabStates() {
        const { [constants.LAST_TAB_STATES_KEY]: lastTabStatesJson } = await this.storageService.get({
            [constants.LAST_TAB_STATES_KEY]: null,
        });
        return lastTabStatesJson && JSON.parse(lastTabStatesJson) || {};
    }

    async getSyncedTabStates() {
        const tabStates = await this.getLastTabStates();
        const openTabs = await chrome.tabs.query({
            url: 'https://www.youtube.com/*',
        });

        Object.keys(tabStates).forEach(key => {
            const tabId = parseInt(key, 10);
            const tab = openTabs.find(t => t.id === tabId);
            if (!tab) {
                delete tabStates[tabId];
            }
        });

        openTabs.forEach(tab => {
            const videoId = getVideoIdFromUrl(tab.url);
            const playlistId = getPlaylistIdFromUrl(tab.url);
            if (videoId || playlistId) {
                const lastTabState = tabStates[tab.id];
                tabStates[tab.id] = {
                    videoId,
                    playlistId,
                    discarded: tab.discarded,
                    playlistVideoIds: lastTabState
                        && playlistId
                        && lastTabState.playlistId === playlistId
                        ? lastTabState.playlistVideoIds : [],
                };
            } else {
                delete tabStates[tab.id];
            }
        });

        this.storageService.set({
            [constants.LAST_TAB_STATES_KEY]: JSON.stringify(tabStates),
        });

        return tabStates;
    }

    async onRequestOpenVideos(sender) {
        const tabStates = await this.getSyncedTabStates();
        const tabs = Object.entries(tabStates).map(([tabId, tabState]) => ({
            id: parseInt(tabId),
            openVideos: getOpenVideos(tabState),
        })).filter(tab => tab.id !== sender.tab.id);
        const bookmarkVideoIds = await getBookmarkVideoIds();
        return {
            tabs,
            bookmarkVideoIds,
        };
    }

    async getLastTabState(tabId) {
        const lastTabStates = await this.getLastTabStates();
        return lastTabStates[tabId];
    }

    async setTabState(tabId, state) {
        const lastTabStates = await this.getLastTabStates();
        lastTabStates[tabId] = state;
        this.storageService.set({
            [constants.LAST_TAB_STATES_KEY]: JSON.stringify(lastTabStates),
        });
    }

    async removeTabState(tabId) {
        const lastTabStates = await this.getLastTabStates();
        delete lastTabStates[tabId];
        this.storageService.set({
            [constants.LAST_TAB_STATES_KEY]: JSON.stringify(lastTabStates),
        });
    }

    async sendTabOpenVideosChange(tabId, openVideos) {
        const openTabIds = await getOpenYoutubeTabIds();
        this.messagesService.sendTabOpenVideosChange(openTabIds.filter(id => id !== tabId), {
            tabId,
            openVideos,
        });
    }

    async onLocalOpenVideosChange(sender, { playlistVideoIds }) {
        const tabId = sender.tab.id;
        const tabState = await this.getLastTabState(tabId);
        tabState.playlistVideoIds = playlistVideoIds;

        await this.setTabState(tabId, tabState);
        await this.sendTabOpenVideosChange(tabId, getOpenVideos(tabState));
    }

    async onTabUpdated(_, { discarded, url }, tab) {
        if (typeof discarded !== 'boolean' && typeof url !== 'string') {
            return;
        }

        const videoId = getVideoIdFromUrl(tab.url);
        const playlistId = getPlaylistIdFromUrl(tab.url);
        const lastTabState = await this.getLastTabState(tab.id);

        if (!videoId && !playlistId && !lastTabState) {
            return;
        }

        const newTabState = videoId || playlistId ? {
            videoId,
            playlistId,
            discarded: tab.discarded,
            playlistVideoIds: lastTabState
                && playlistId
                && lastTabState.playlistId === playlistId
                ? lastTabState.playlistVideoIds : []
        } : null;

        if (videoId || playlistId) {
            await this.setTabState(tab.id, newTabState);
        } else {
            await this.removeTabState(tab.id);
        }

        const openVideos = newTabState ? getOpenVideos(newTabState) : [];

        await this.sendTabOpenVideosChange(tab.id, openVideos);
    }

    async onTabRemoved(tabId) {
        await this.removeTabState(tabId);
        await this.sendTabOpenVideosChange(tabId, []);
    }

    async onBookmarkChanged() {
        const bookmarkVideoIds = await getBookmarkVideoIds();
        const openTabIds = await getOpenYoutubeTabIds();
        messagesService.sendBookmarkOpenVideos(openTabIds, { bookmarkVideoIds });
    }
}
