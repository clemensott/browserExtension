import { navigationChange } from '../constants';
import getCurrentVideoId from '../utils/getCurrentVideoId';
import sleep from '../utils/sleep';

const constants = {
    STORAGE_KEY_PREFIX: 'yt-extension-video-open-open-entry-',
    LAST_GARBAGE_COLLECT_STORAGE_KEY: 'yt-extension-video-open-last-garbage-collect',
    VALID_SECONDS_KEY: 'yt-extension-video-open-valid-seconds',
    VIDEO_OPEN_CHANGE_EVENTNAME: 'VideoOpenStorageService.videoOpenChange',
};

export default class VideoOpenStorageService {
    constructor(navigatoreEventService) {
        this.navigatoreEventService = navigatoreEventService;
        this.validSeconds = parseInt(localStorage.getItem(constants.VALID_SECONDS_KEY), 10) || 1000;
        this.garbageCollectStorageInvalid = true;
        this.videoOpenTabStorageKey = `${constants.STORAGE_KEY_PREFIX}${Date.now()}-${Math.random()}`;
        this.videoOpenCache = new Map();
        this.lastVideoId = null;
        this.updateVideoOpenCacheIntervalId = null;
        this.setVideoIdIntervalId = null;
        this.garbageCollectIntervalId = null;

        this.onStorageChange = this.onStorageChange.bind(this);
        this.onUrlChange = this.onUrlChange.bind(this);
        this.setVideoOpen = this.setVideoOpen.bind(this);
        this.onBeforeUnload = this.onBeforeUnload.bind(this);
        this.loadOpenVideosCache = this.loadOpenVideosCache.bind(this);
        this.onCheckGarbageCollect = this.onCheckGarbageCollect.bind(this);
    }

    start() {
        window.addEventListener('storage', this.onStorageChange);
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.navigatoreEventService.addOnUrlChangeEventHandler(this.onUrlChange);
        this.onUrlChange({
            detail: this.navigatoreEventService.getInitalArgs(),
        });
        this.updateVideoOpenCacheIntervalId = setInterval(this.loadOpenVideosCache, 60 * 1000);
        this.garbageCollectIntervalId = setInterval(this.onCheckGarbageCollect, 1000 * 1000);
        this.loadOpenVideosCache();
    }

    stop() {
        window.removeEventListener('storage', this.onStorageChange);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        this.navigatoreEventService.removeOnUrlChangeEventHandler(this.onUrlChange);
        this.onChangeWatchUrl(null);
        clearInterval(this.updateVideoOpenCacheIntervalId);
        clearInterval(this.garbageCollectIntervalId);
    }

    onStorageChange({ key, newValue, oldValue }) {
        if (key.startsWith(constants.STORAGE_KEY_PREFIX)) {
            this.garbageCollectStorageInvalid = true;

            if (oldValue) {
                const { videoId } = JSON.parse(oldValue);
                this.decreaseVideoOpenCount(videoId);
            }
            if (newValue) {
                const { videoId } = JSON.parse(newValue);
                this.increaseVideoOpenCount(videoId);
            }
        }
    }

    onBeforeUnload() {
        this.onChangeWatchUrl(null);
    }

    onUrlChange({ detail }) {
        switch (detail.isVideoWatchSite) {
            case navigationChange.ENTERED:
            case navigationChange.STAYED:
                this.onChangeWatchUrl(getCurrentVideoId());
                break;

            case navigationChange.LEFT:
            case navigationChange.NONE:
                this.onChangeWatchUrl(null);
                break;
        }
    }

    onChangeWatchUrl(videoId) {
        if (videoId === this.lastVideoId) {
            return;
        }

        clearInterval(this.setVideoIdIntervalId);

        if (videoId) {
            this.setVideoIdIntervalId = setInterval(this.setVideoOpen, this.validSeconds / 2 * 1000, videoId);
            this.setVideoOpen(videoId);
        } else {
            this.removeVideoOpen();
        }

        this.lastVideoId = videoId;
    }

    setVideoOpen(videoId) {
        localStorage.setItem(this.videoOpenTabStorageKey, JSON.stringify({
            videoId,
            timestamp: Date.now(),
        }));
    }

    removeVideoOpen() {
        clearInterval(this.setVideoIdIntervalId);
        localStorage.removeItem(this.videoOpenTabStorageKey);
    }

    isVideoOpen(videoId) {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(constants.STORAGE_KEY_PREFIX))
            .map(key => JSON.parse(localStorage.getItem(key)))
            .filter(entry => entry.videoId === videoId)
            .some(entry => Date.now() > entry.timestamp + this.validSeconds * 1000);
    }

    loadOpenVideosCache() {
        this.videoOpenCache.clear();

        Object.keys(localStorage)
            .filter(key => key.startsWith(constants.STORAGE_KEY_PREFIX))
            .filter(key => key !== this.videoOpenTabStorageKey)
            .map(key => JSON.parse(localStorage.getItem(key)))
            .filter(entry => Date.now() < entry.timestamp + this.validSeconds * 1000)
            .map(entry => entry.videoId)
            .forEach(videoId => this.increaseVideoOpenCount(videoId));
    }

    increaseVideoOpenCount(videoId) {
        const count = this.videoOpenCache.get(videoId) || 0;
        this.videoOpenCache.set(videoId, count + 1);
    }

    decreaseVideoOpenCount(videoId) {
        const count = this.videoOpenCache.get(videoId) || 0;
        if (count > 1) {
            this.videoOpenCache.set(videoId, count - 1);
        } else {
            this.videoOpenCache.delete(videoId);
        }
    }

    isVideoOpenFromCache(videoId) {
        return this.videoOpenCache.has(videoId);
    }

    async onCheckGarbageCollect() {
        const lastGarbageCollectTime = parseInt(localStorage.getItem(constants.LAST_GARBAGE_COLLECT_STORAGE_KEY), 10);
        if (!lastGarbageCollectTime || lastGarbageCollectTime + 1000 * 1000 > Date.now()) {
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

            for (const invalidElement in invalidElements) {
                await sleep(10);
                if (this.garbageCollectStorageInvalid) {
                    break;
                }
                localStorage.removeItem(invalidElement.key);
            }
        }
        localStorage.setItem(constants.LAST_GARBAGE_COLLECT_STORAGE_KEY, Date.now().toString());
    }
}
