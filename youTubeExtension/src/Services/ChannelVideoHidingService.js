import KeysTracker from '../utils/KeysTracker';
import NavigationEventService from './NavigationEventService';
import triggerEvent from "../utils/triggerEvent";
import './ChannelVideoHidingService.css';


const constants = {
    UPDATE_COUNT_UPPER_THRESHOLD: 300,
    UPDATE_COUNT_LOWER_THRESHOLD: 120,
    HIDE_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-all',
    HIDE_NOT_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-not-all',
    RUNNING_CHANGE_EVENTNAME: 'ChannelVideoHidingService.runningChange',
};

function getContainer() {
    return document.querySelector('#items.style-scope.ytd-grid-renderer');
}

function getCurrentFetchedVideosCount(container) {
    return container.childElementCount;
}

function finisedFetchingVideos(container) {
    return !container.querySelector('ytd-continuation-item-renderer');
}

export default class ChannelVideoHidingService {
    constructor() {
        this.intervalId = null;
        this.isWatingToCoolDown = false;
        this.updatingVideoIds = new KeysTracker();

        document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
            this.updatingVideoIds.add(videos.map(v => v.id));

            setTimeout(() => this.intervalId && this.checkHideCount(), 100);
        });

        document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
            this.updatingVideoIds.remove(videoIds);

            if (this.intervalId) {
                this.checkHideCount();
            }
        });
    }

    checkHideCount(log = false) {
        const container = getContainer();
        if (!container) return;

        if (this.isHiding() && !finisedFetchingVideos(container) && NavigationEventService.isChannelVideosSite()) {
            const updateCount = this.updatingVideoIds.totalCount();
            if (log) {
                const videosCount = getCurrentFetchedVideosCount(container);
                console.log('hiding:', { isWatingToCoolDown: this.isWatingToCoolDown, updateCount, videosCount });
            }

            if (updateCount >= constants.UPDATE_COUNT_UPPER_THRESHOLD ||
                (this.isWatingToCoolDown && updateCount > constants.UPDATE_COUNT_LOWER_THRESHOLD)) {
                container.classList.add(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
                container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);

                this.isWatingToCoolDown = true;
            } else {
                container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
                container.classList.add(constants.HIDE_ALL_VIDEOS_CLASSNAME);
                window.scrollTo(0, Math.random() * 400); // scroll to trigger loading next videos
                this.isWatingToCoolDown = false;
            }
        } else {
            container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
        }
    }

    start() {
        if (!this.isHiding()) {
            this.intervalId = setInterval(() => this.checkHideCount(true), 5000);
            this.checkHideCount(true);

            triggerEvent(constants.RUNNING_CHANGE_EVENTNAME, {
                isRunning: true,
            });
        }
    }

    stop() {
        if (this.isHiding()) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.checkHideCount();

            triggerEvent(constants.RUNNING_CHANGE_EVENTNAME, {
                isRunning: false,
            });
        }
    }

    isHiding() {
        return !!this.intervalId;
    }

    addRunningChangeEventListener(callback) {
        document.addEventListener(constants.RUNNING_CHANGE_EVENTNAME, callback);
    }

    removeRunningChangeEventListener(callback) {
        document.removeEventListener(constants.RUNNING_CHANGE_EVENTNAME, callback);
    }
}
