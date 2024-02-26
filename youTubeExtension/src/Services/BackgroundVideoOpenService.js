import { openVideoType } from '../constants';
import getPlaylistIdFromUrl from '../utils/getPlaylistIdFromUrl';
import getVideoIdFromUrl from '../utils/getVideoIdFromUrl';
import browser from 'webextension-polyfill';

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
    const tree = await browser.bookmarks.getTree();
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
    const openTabs = await browser.tabs.query({
        discarded: false,
        url: 'https://www.youtube.com/*',
    });
    return openTabs.map(t => t.id);
}

export default class BackgroundVideoOpenService {
    constructor(storageService, messagesService) {
        this.storageService = storageService;
        this.messagesService = messagesService;

        this.lastTabStates = null;
        this.loadLastTabStatesPromise = null;

        this.onRequestOpenVideos = this.onRequestOpenVideos.bind(this);
        this.onLocalOpenVideosChange = this.onLocalOpenVideosChange.bind(this);
        this.onTabUpdated = this.onTabUpdated.bind(this);
        this.onTabRemoved = this.onTabRemoved.bind(this);
        this.onTabReplaced = this.onTabReplaced.bind(this);
        this.onBookmarkChanged = this.onBookmarkChanged.bind(this);
    }

    start() {
        this.messagesService.onRequestOpenVideos(this.onRequestOpenVideos);
        this.messagesService.onLocalOpenVideosChange(this.onLocalOpenVideosChange);
        browser.tabs.onUpdated.addListener(this.onTabUpdated);
        browser.tabs.onRemoved.addListener(this.onTabRemoved);
        browser.tabs.onReplaced.addListener(this.onTabReplaced);

        browser.bookmarks.onCreated.addListener(this.onBookmarkChanged);
        browser.bookmarks.onChanged.addListener(this.onBookmarkChanged);
        browser.bookmarks.onRemoved.addListener(this.onBookmarkChanged);
    }

    async loadLastTabStates() {
        const { [constants.LAST_TAB_STATES_KEY]: lastTabStatesJson } = await this.storageService.get({
            [constants.LAST_TAB_STATES_KEY]: null,
        });
        return lastTabStatesJson && JSON.parse(lastTabStatesJson) || {};
    }

    async getLastTabStates() {
        if (!this.lastTabStates) {
            if (!this.loadLastTabStatesPromise) {
                this.loadLastTabStatesPromise = this.loadLastTabStates();
                this.lastTabStates = await this.loadLastTabStatesPromise;
            } else {
                await this.loadLastTabStatesPromise;
            }
        }
        return this.lastTabStates;
    }

    async setLastTabStates() {
        this.storageService.set({
            [constants.LAST_TAB_STATES_KEY]: JSON.stringify(this.lastTabStates),
        });
    }

    async getSyncedTabStates() {
        const tabStates = await this.getLastTabStates();
        const openTabs = await browser.tabs.query({
            url: 'https://www.youtube.com/*',
        });

        Object.keys(tabStates).forEach(key => {
            const tabId = parseInt(key, 10);
            const tab = openTabs.find(t => t.id === tabId);
            if (!tab) {
                console.warn('getSyncedTabStates detete tab state:', tabId, tabStates[tabId]);
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

        await this.setLastTabStates();

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
        await this.setLastTabStates();
    }

    async removeTabState(tabId) {
        const lastTabStates = await this.getLastTabStates();
        delete lastTabStates[tabId];
        await this.setLastTabStates();
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
            console.log('updated tab4:', tab.id)
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

    async onTabReplaced(newTabId, oldTabId) {
        const tabStates = await this.getLastTabStates();
        tabStates[newTabId] = tabStates[oldTabId];
        delete tabStates[oldTabId];
        await this.setLastTabStates();

        await this.sendTabOpenVideosChange(newTabId, getOpenVideos(tabStates[newTabId]));
        await this.sendTabOpenVideosChange(oldTabId, []);
    }

    async onBookmarkChanged() {
        const bookmarkVideoIds = await getBookmarkVideoIds();
        const openTabIds = await getOpenYoutubeTabIds();
        this.messagesService.sendBookmarkOpenVideos(openTabIds, { bookmarkVideoIds });
    }
}
