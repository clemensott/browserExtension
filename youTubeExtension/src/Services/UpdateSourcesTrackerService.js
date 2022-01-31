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
    }

    init() {
        document.addEventListener('updateSources.startHandleVideos', this.onStartHandleVideos.bind(this));
        document.addEventListener('updateSources.endHandleVideos', this.onEndHandleVideos.bind(this));
        document.addEventListener('updateSources.startUpdateThumbnails', this.onStartUpdateThumbnails.bind(this));
        document.addEventListener('updateSources.endUpdateThumbnails', this.onEndUpdateThumbnails.bind(this));
    }

    onStartHandleVideos({ detail: videos }) {
        this.videoData.add(videos.map(v => v.id));

        triggerEvent(constants.VIDEO_DATA_CHANGE_EVENTNAME, {
            tracker: this.videoData,
            startVideos: videos,
            endVideos: null,
        });
    }

    onEndHandleVideos({ detail: videos }) {
        this.videoData.remove(videos.map(v => v.id));

        triggerEvent(constants.VIDEO_DATA_CHANGE_EVENTNAME, {
            tracker: this.videoData,
            startVideos: null,
            endVideos: videos,
        });
    }

    onStartUpdateThumbnails({ detail: videoIds }) {
        this.videoThumbnails.add(videoIds);

        triggerEvent(constants.VIDEO_THUMBNAILS_CHANGE_EVENTNAME, {
            tracker: this.videoThumbnails,
            startVideoIds: videoIds,
            endVideoIds: null,
        });
    }

    onEndUpdateThumbnails({ detail: videoIds }) {
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
