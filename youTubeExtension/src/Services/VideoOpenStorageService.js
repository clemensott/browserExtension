import { navigationChange, openVideoType } from '../constants';
import getCurrentVideoId from '../utils/getCurrentVideoId';
import sleep from '../utils/sleep';
import randomString from '../utils/randomString';
import triggerEvent from '../utils/triggerEvent';
import getVideoIdFromVideoContainer from '../utils/getVideoIdFromVideoContainer';
import setIntervalUntil from '../utils/setIntervalUntil';

const constants = {
    STORAGE_KEY_PREFIX: 'yt-extension-video-open-open-entry-',
    LAST_GARBAGE_COLLECT_STORAGE_KEY: 'yt-extension-video-open-last-garbage-collect',
    VALID_SECONDS_KEY: 'yt-extension-video-open-valid-seconds',
    VIDEO_OPEN_CHANGE_EVENTNAME: 'VideoOpenStorageService.videoOpenChange',
    PLAYLIST_TYPE: 'playlist',
    DISCARDED_TYPE: 'bookmark',
    BOOKMARK_TYPE: 'bookmark',
};

function getOpenVideoIds() {
    const videoIds = [
        {
            videoId: getCurrentVideoId(),
            type: openVideoType.WATCH,
        },
        ...[
            ...document.querySelectorAll('#items > ytd-playlist-panel-video-renderer'),
        ].map(container => ({
            videoId: getVideoIdFromVideoContainer(container),
            type: openVideoType.PLAYLIST,
        })),
    ];
    return videoIds.filter(v => v.videoId);
}

function diffVideoIdArrays(a, b) {
    return [
        a.filter(i => !b.some(j => i.videoId === j.videoId && i.type === j.type)),
        b.filter(i => !a.some(j => i.videoId === j.videoId && i.type === j.type)),
    ];
}

export default class VideoOpenStorageService {
    constructor(navigatoreEventService, messagesService) {
        this.navigatoreEventService = navigatoreEventService;
        this.messagesService = messagesService;
        this.validSeconds = parseInt(localStorage.getItem(constants.VALID_SECONDS_KEY), 10) || 1000;
        this.garbageCollectStorageInvalid = true;
        this.videoOpenTabStorageKey = `${constants.STORAGE_KEY_PREFIX}${randomString()}`;
        this.bookmarkVideoIds = [];
        this.discardedVideoIds = [];
        this.videoOpenCache = new Map();
        this.lastVideoIds = [];
        this.checkOpenVideoIdsIntervalId = null;
        this.updateVideoOpenCacheIntervalId = null;
        this.setVideosIdIntervalId = null;
        this.garbageCollectIntervalId = null;

        this.onStorageChange = this.onStorageChange.bind(this);
        this.onUrlChange = this.onUrlChange.bind(this);
        this.setVideosOpen = this.setVideosOpen.bind(this);
        this.onBeforeUnload = this.onBeforeUnload.bind(this);
        this.onDiscardedVideoIdsChanged = this.onDiscardedVideoIdsChanged.bind(this);
        this.onBookmarkVideoIdsChanged = this.onBookmarkVideoIdsChanged.bind(this);
        this.checkOpenVideoIdsLoop = this.checkOpenVideoIdsLoop.bind(this);
        this.loadOpenVideosCache = this.loadOpenVideosCache.bind(this);
        this.onCheckGarbageCollect = this.onCheckGarbageCollect.bind(this);
    }

    start() {
        window.addEventListener('storage', this.onStorageChange);
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.messagesService.onDiscardedOpenVideos(this.onDiscardedVideoIdsChanged);
        this.messagesService.onBookmarkOpenVideos(this.onBookmarkVideoIdsChanged);
        this.navigatoreEventService.addOnUrlChangeEventHandler(this.onUrlChange);
        this.onUrlChange({
            detail: this.navigatoreEventService.getInitalArgs(),
        });
        this.updateVideoOpenCacheIntervalId = setInterval(this.loadOpenVideosCache, 60 * 1000);
        this.garbageCollectIntervalId = setInterval(this.onCheckGarbageCollect, 1000 * 1000);

        this.requestOpenVideos();
        this.loadOpenVideosCache();
    }

    stop() {
        window.removeEventListener('storage', this.onStorageChange);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        this.navigatoreEventService.removeOnUrlChangeEventHandler(this.onUrlChange);
        this.onChangeWatchVideoIds(null);
        clearInterval(this.updateVideoOpenCacheIntervalId);
        clearInterval(this.garbageCollectIntervalId);
    }

    onStorageChange({ key, newValue, oldValue }) {
        if (key.startsWith(constants.STORAGE_KEY_PREFIX)) {
            this.garbageCollectStorageInvalid = true;

            let oldVideoIds = [];
            let newVideoIds = [];
            if (oldValue) {
                oldVideoIds = JSON.parse(oldValue).videoIds || [];
                oldVideoIds.forEach(entry => this.decreaseVideoOpenCount(entry));
            }
            if (newValue) {
                newVideoIds = JSON.parse(newValue).videoIds || [];
                newVideoIds.forEach(entry => this.increaseVideoOpenCount(entry));
            }

            const [closedVideoIds, openedVideoIds] = diffVideoIdArrays(oldVideoIds, newVideoIds);
            if (closedVideoIds.length || openedVideoIds.length) {
                this.triggerOpenChangedEvent(
                    closedVideoIds.map(v => v.videoId),
                    openedVideoIds.map(v => v.videoId),
                );
            }
        }
    }

    onBeforeUnload() {
        this.onChangeWatchVideoIds(null);
    }

    onDiscardedVideoIdsChanged({ discardedVideoIds }) {
        this.discardedVideoIds = discardedVideoIds;
        this.loadOpenVideosCache();
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
                    this.onChangeWatchVideoIds(getOpenVideoIds());
                    return Date.now() - start > 5 * 1000;
                }, 300);
                break;

            case navigationChange.LEFT:
            case navigationChange.NONE:
                this.onChangeWatchVideoIds(null);
                break;
        }
    }

    checkOpenVideoIdsLoop() {
        this.onChangeWatchVideoIds(getOpenVideoIds());
    }

    onChangeWatchVideoIds(videoIds) {
        const diffs = diffVideoIdArrays(videoIds || [], this.lastVideoIds);
        if (diffs.every(d => !d.length)) {
            return;
        }
        clearInterval(this.setVideosIdIntervalId);

        if (videoIds) {
            this.setVideosIdIntervalId = setInterval(this.setVideosOpen, this.validSeconds / 2 * 1000, videoIds);
            this.setVideosOpen(videoIds);
        } else {
            this.removeVideoOpen();
        }

        this.lastVideoIds = videoIds || [];
    }

    setVideosOpen(videoIds) {
        localStorage.setItem(this.videoOpenTabStorageKey, JSON.stringify({
            videoIds,
            timestamp: Date.now(),
        }));
    }

    removeVideoOpen() {
        clearInterval(this.setVideosIdIntervalId);
        localStorage.removeItem(this.videoOpenTabStorageKey);
    }

    async requestOpenVideos() {
        const { discardedVideoIds, bookmarkVideoIds } = await this.messagesService.sendRequestOpenVideos();
        this.discardedVideoIds = discardedVideoIds;
        this.bookmarkVideoIds = bookmarkVideoIds;
        
        this.loadOpenVideosCache();
    }

    async loadOpenVideosCache() {
        const openVideoIds = Object.keys(localStorage)
            .filter(key => key.startsWith(constants.STORAGE_KEY_PREFIX))
            .filter(key => key !== this.videoOpenTabStorageKey)
            .map(key => JSON.parse(localStorage.getItem(key)))
            .filter(entry => Date.now() < entry.timestamp + this.validSeconds * 1000)
            .flatMap(entry => entry.videoIds)
            .filter(Boolean);

        const oldOpenVideoIds = new Set(
            [...this.videoOpenCache.keys()].filter(key => this.isVideoOpenFromCache(key).length),
        );

        this.videoOpenCache.clear();
        openVideoIds.forEach(entry => this.increaseVideoOpenCount(entry));
        this.discardedVideoIds.forEach(videoId => this.increaseVideoOpenCount({ videoId, type: openVideoType.DISCARDED }));
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

    async onCheckGarbageCollect() {
        const lastGarbageCollectTime = parseInt(localStorage.getItem(constants.LAST_GARBAGE_COLLECT_STORAGE_KEY), 10);
        if (!lastGarbageCollectTime || (Date.now() - lastGarbageCollectTime > 900 * 1000)) {
            await this.garbageCollectOpenVideoEntries();
        }
    }

    async garbageCollectOpenVideoEntries() {
        while (true) {
            this.garbageCollectStorageInvalid = false;
            const invalidElements = Object.keys(localStorage)
                .filter(key => key.startsWith(constants.STORAGE_KEY_PREFIX))
                .map(key => ({
                    ...JSON.parse(localStorage.getItem(key)),
                    key,
                }))
                .filter(({ timestamp }) => Date.now() > timestamp + this.validSeconds * 1000);

            if (!invalidElements.length) {
                break;
            }

            for (const invalidElement of invalidElements) {
                await sleep(10);
                if (this.garbageCollectStorageInvalid) {
                    break;
                }
                localStorage.removeItem(invalidElement.key);
            }
        }
        localStorage.setItem(constants.LAST_GARBAGE_COLLECT_STORAGE_KEY, Date.now().toString());
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
