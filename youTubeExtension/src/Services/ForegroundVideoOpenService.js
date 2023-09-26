import { navigationChange, openVideoType } from '../constants';
import triggerEvent from '../utils/triggerEvent';
import getVideoIdFromVideoContainer from '../utils/getVideoIdFromVideoContainer';
import setIntervalUntil from '../utils/setIntervalUntil';
import getPlaylistIdFromUrl from '../utils/getPlaylistIdFromUrl';

const constants = {
    VIDEO_OPEN_CHANGE_EVENTNAME: 'ForegroundVideoOpenService.videoOpenChange',
};

function getPlaylistOpenVideoIds() {
    return [...document.querySelectorAll('#items > ytd-playlist-panel-video-renderer')]
        .map(container => getVideoIdFromVideoContainer(container))
        .filter(Boolean);
}

function equalVideoIds(a, b) {
    return (
        a.length === b.length
        && a.every(i => b.includes(i))
        && b.every(i => a.includes(i))
    );
}

export default class ForegroundVideoOpenService {
    constructor(navigatoreEventService, messagesService) {
        this.navigatoreEventService = navigatoreEventService;
        this.messagesService = messagesService;
        this.playlistVideoIds = [];
        this.bookmarkVideoIds = [];
        this.tabsOpenVideos = new Map();
        this.videoOpenCache = new Map();
        this.checkOpenVideoIdsIntervalId = null;

        this.onUrlChange = this.onUrlChange.bind(this);
        this.onTabOpenVideosChange = this.onTabOpenVideosChange.bind(this);
        this.onBookmarkVideoIdsChanged = this.onBookmarkVideoIdsChanged.bind(this);
        this.checkOpenVideoIdsLoop = this.checkOpenVideoIdsLoop.bind(this);
        this.loadOpenVideosCache = this.loadOpenVideosCache.bind(this);
    }

    start() {
        this.messagesService.onTabOpenVideosChange(this.onTabOpenVideosChange);
        this.messagesService.onBookmarkOpenVideos(this.onBookmarkVideoIdsChanged);
        this.navigatoreEventService.addOnUrlChangeEventHandler(this.onUrlChange);
        this.onUrlChange({
            detail: this.navigatoreEventService.getInitalArgs(),
        });

        this.checkOpenVideoIdsIntervalId = setInterval(this.checkOpenVideoIdsLoop, 10 * 1000);

        this.requestOpenVideos();
        this.loadOpenVideosCache();
    }

    stop() {
        this.navigatoreEventService.removeOnUrlChangeEventHandler(this.onUrlChange);
        this.onChangeWatchVideoIds({ playlistVideoIds: [] });
    }

    onTabOpenVideosChange({ tabId, openVideos }) {
        if (openVideos.length) {
            this.tabsOpenVideos.set(tabId, openVideos);
            this.loadOpenVideosCache();
        } else if (!openVideos.length && this.tabsOpenVideos.has(tabId)) {
            this.tabsOpenVideos.delete(tabId);
            
            this.loadOpenVideosCache();
        }
    }

    onBookmarkVideoIdsChanged({ bookmarkVideoIds }) {
        this.bookmarkVideoIds = bookmarkVideoIds;
        this.loadOpenVideosCache();
    }

    onUrlChange({ detail }) {
        switch (detail.isVideoWatchSite) {
            case navigationChange.ENTERED:
            case navigationChange.STAYED:
                const start = Date.now();
                setIntervalUntil(() => {
                    this.checkOpenVideoIdsLoop();
                    return Date.now() - start > 10 * 1000;
                }, 300);
                break;

            case navigationChange.LEFT:
            case navigationChange.NONE:
                this.onChangeWatchVideoIds({ playlistVideoIds: [] });
                break;
        }
    }

    checkOpenVideoIdsLoop() {
        this.onChangeWatchVideoIds({
            playlistVideoIds: getPlaylistIdFromUrl(window.location.href) ? getPlaylistOpenVideoIds() : [],
        });
    }

    onChangeWatchVideoIds({ playlistVideoIds }) {
        if (equalVideoIds(playlistVideoIds, this.playlistVideoIds)) {
            return;
        }

        this.messagesService.sendLocalOpenVideosChange({ playlistVideoIds });
        this.playlistVideoIds = playlistVideoIds;
    }

    async requestOpenVideos() {
        const { tabs, bookmarkVideoIds } = await this.messagesService.sendRequestOpenVideos();
        tabs.forEach(tab => this.tabsOpenVideos.set(tab.id, tab.openVideos));
        this.bookmarkVideoIds = bookmarkVideoIds;

        this.loadOpenVideosCache();
    }

    async loadOpenVideosCache() {
        const oldOpenVideoIds = new Set(
            [...this.videoOpenCache.keys()].filter(key => this.isVideoOpenFromCache(key).length),
        );

        this.videoOpenCache.clear();
        [...this.tabsOpenVideos.values()].flat().forEach(entry => this.increaseVideoOpenCount(entry));
        this.bookmarkVideoIds.forEach(videoId => this.increaseVideoOpenCount({ videoId, type: openVideoType.BOOKMARK }));

        const closedVideoIds = Array.from(oldOpenVideoIds).filter(videoId => !this.isVideoOpenFromCache(videoId).length);
        const openedVideoIds = Array.from(this.videoOpenCache.keys()).filter(videoId => !oldOpenVideoIds.has(videoId));
        this.triggerOpenChangedEvent(closedVideoIds, openedVideoIds);
    }

    getVideoCacheCounts(videoId) {
        let counts = this.videoOpenCache.get(videoId);
        if (!counts) {
            counts = {};
            this.videoOpenCache.set(videoId, counts);
        }
        return counts;
    }

    increaseVideoOpenCount({ videoId, type }) {
        const counts = this.getVideoCacheCounts(videoId);
        counts[type] = (counts[type] || 0) + 1;
    }

    decreaseVideoOpenCount({ videoId, type }) {
        const counts = this.getVideoCacheCounts(videoId);
        if (counts[type] > 1) {
            counts[type]--;
        } else {
            delete counts[type];
        }
    }

    isVideoOpenFromCache(videoId) {
        const cache = this.videoOpenCache.get(videoId);
        return cache ? Object.keys(cache) : [];
    }

    triggerOpenChangedEvent(closedVideoIds, openedVideoIds) {
        triggerEvent(constants.VIDEO_OPEN_CHANGE_EVENTNAME, {
            closedVideoIds,
            openedVideoIds,
        });
    }

    addOpenChangedEventListener(callback) {
        document.addEventListener(constants.VIDEO_OPEN_CHANGE_EVENTNAME, callback);
    }

    removeOpenChangedEventListener(callback) {
        document.removeEventListener(constants.VIDEO_OPEN_CHANGE_EVENTNAME, callback);
    }
}
