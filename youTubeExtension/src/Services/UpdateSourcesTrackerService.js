import getTabId from '../utils/getTabId';
import KeysTracker from '../utils/KeysTracker';
import triggerEvent from '../utils/triggerEvent';


const constants = {
    VIDEO_DATA_CHANGE_EVENTNAME: 'UpdateSourcesTrackerService.videoDataChange',
    VIDEO_THUMBNAILS_CHANGE_EVENTNAME: 'UpdateSourcesTrackerService.videoThumbnailsChange',
};

export default class UpdateSourcesTrackerService {
    constructor() {
        this.videoData = new KeysTracker();
        this.videoThumbnails = new KeysTracker();
        this.updateBroadcast = new BroadcastChannel('updateSources');
    }

    init() {
        this.updateBroadcast.addEventListener('message', ({ data }) => {
            if (data.tabId !== getTabId()) {
                return;
            }
            switch (data.type) {
                case 'startHandleVideos':
                    return this.onStartHandleVideos(data);
                case 'endHandleVideos':
                    return this.onEndHandleVideos(data);
                case 'startUpdateThumbnails':
                    return this.onStartUpdateThumbnails(data);
                case 'endUpdateThumbnails':
                    return this.onEndUpdateThumbnails(data);
            }
        });
    }

    onStartHandleVideos({ videos }) {
        this.videoData.add(videos.map(v => v.id));

        triggerEvent(constants.VIDEO_DATA_CHANGE_EVENTNAME, {
            tracker: this.videoData,
            startVideos: videos,
            endVideos: null,
        });
    }

    onEndHandleVideos({ videos }) {
        this.videoData.remove(videos.map(v => v.id));

        triggerEvent(constants.VIDEO_DATA_CHANGE_EVENTNAME, {
            tracker: this.videoData,
            startVideos: null,
            endVideos: videos,
        });
    }

    onStartUpdateThumbnails({ videoIds }) {
        this.videoThumbnails.add(videoIds);

        triggerEvent(constants.VIDEO_THUMBNAILS_CHANGE_EVENTNAME, {
            tracker: this.videoThumbnails,
            startVideoIds: videoIds,
            endVideoIds: null,
        });
    }

    onEndUpdateThumbnails({ videoIds }) {
        this.videoThumbnails.remove(videoIds);

        triggerEvent(constants.VIDEO_THUMBNAILS_CHANGE_EVENTNAME, {
            tracker: this.videoThumbnails,
            startVideoIds: null,
            endVideoIds: videoIds,
        });
    }

    totalCount() {
        return this.videoData.totalCount() + this.videoThumbnails.totalCount();
    }

    addVideoDataChangeEventListener(callback) {
        document.addEventListener(constants.VIDEO_DATA_CHANGE_EVENTNAME, callback);
    }

    removeVideoDataChangeEventListener(callback) {
        document.addEventListener(constants.VIDEO_DATA_CHANGE_EVENTNAME, callback);
    }

    addVideoThumbnailsChangeEventListener(callback) {
        document.addEventListener(constants.VIDEO_THUMBNAILS_CHANGE_EVENTNAME, callback);
    }

    removeVideoThumbnailsChangeEventListener(callback) {
        document.addEventListener(constants.VIDEO_THUMBNAILS_CHANGE_EVENTNAME, callback);
    }
}
