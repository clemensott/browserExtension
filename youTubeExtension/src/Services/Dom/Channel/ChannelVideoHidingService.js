import triggerEvent from '../../../utils/triggerEvent';
import './ChannelVideoHidingService.css';


const constants = {
    UPDATE_COUNT_UPPER_THRESHOLD: 300,
    UPDATE_COUNT_LOWER_THRESHOLD: 120,
    HIDE_LOAD_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-load',
    HIDE_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-all',
    HIDE_NOT_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-not-all',
    RUNNING_CHANGE_EVENTNAME: 'ChannelVideoHidingService.runningChange',
};

export default class ChannelVideoHidingService {
    constructor({ domService, fetchIntersectorService, updateSourcesTrackerService }) {
        this.domService = domService;
        this.fetchIntersectorService = fetchIntersectorService;
        this.updateSourcesTrackerService = updateSourcesTrackerService;

        this.intervalId = null;
        this.isWatingToCoolDown = false;
        this.lastObj = null;

        this.onChannelVideosChange = this.onChannelVideosChange.bind(this);
    }

    init() {
        this.domService.channelVideosCount.addEventListener(this.onChannelVideosChange);
    }

    onChannelVideosChange({ detail: { currentElements: newObj, lastElements: oldObj } }) {
        if (oldObj) {
            this.removeContainer(oldObj.videoListContainer);
        }

        this.lastObj = newObj;
        this.checkHideCount();
    }

    removeContainer(container) {
        if (container) {
            container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_LOAD_VIDEOS_CLASSNAME);
        }
    }

    checkHideCount() {
        const { videoListContainer: container, hasVideosFetchingContinuation } = this.lastObj || {};
        if (this.isHiding() && container && hasVideosFetchingContinuation) {
            const updateCount = this.updateSourcesTrackerService.totalCount();

            if (updateCount >= constants.UPDATE_COUNT_UPPER_THRESHOLD ||
                (this.isWatingToCoolDown && updateCount > constants.UPDATE_COUNT_LOWER_THRESHOLD)) {
                container.classList.add(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
                container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
                container.classList.remove(constants.HIDE_LOAD_VIDEOS_CLASSNAME);

                this.isWatingToCoolDown = true;
            } else {
                container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
                container.classList.add(constants.HIDE_ALL_VIDEOS_CLASSNAME);
                container.classList.add(constants.HIDE_LOAD_VIDEOS_CLASSNAME);
                this.isWatingToCoolDown = false;
            }
        } else {
            this.removeContainer(container);
        }
    }

    start() {
        if (!this.isHiding()) {
            this.intervalId = setInterval(() => this.checkHideCount(), 5000);
            this.checkHideCount();

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

    get fastMode(){
        return this.fetchIntersectorService.reduceVideosEnabled;
    }

    set fastMode(value){
        this.fetchIntersectorService.setReduceVideosEnabled(value);
    }

    addRunningChangeEventListener(callback) {
        document.addEventListener(constants.RUNNING_CHANGE_EVENTNAME, callback);
    }

    removeRunningChangeEventListener(callback) {
        document.removeEventListener(constants.RUNNING_CHANGE_EVENTNAME, callback);
    }
}
