const constants = {
    REQUEST_OPEN_VIDEOS: 'request_open_videos',
    LOCAL_OPEN_VIDEOS_CHANGE: 'local_open_videos_change',
    TAB_OPEN_VIDEOS_CHANGE: 'tab_open_videos_change',
    BOOKMARK_OPEN_VIDEO: 'bookmark_open_videos',
};

export default class MessagesService {
    constructor() {
        this.callbacks = {
            requestOpenVideos: null,
            localOpenVideosChange: [],
            tabOpenVideosChange: [],
            bookmarkOpenVideos: [],
        };

        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    }

    onMessage(message, sender, sendResponse) {
        switch (message.type) {
            case constants.REQUEST_OPEN_VIDEOS:
                (async () => sendResponse(await this.callbacks.requestOpenVideos(sender)))();
                return true;
            case constants.LOCAL_OPEN_VIDEOS_CHANGE:
                this.callbacks.localOpenVideosChange.forEach(callback => callback(sender, message.data));
                return;
            case constants.TAB_OPEN_VIDEOS_CHANGE:
                this.callbacks.tabOpenVideosChange.forEach(callback => callback(message.data));
                return;
            case constants.BOOKMARK_OPEN_VIDEO:
                this.callbacks.bookmarkOpenVideos.forEach(callback => callback(message.data));
                return;
        }
    }

    sendRequestOpenVideos() {
        return chrome.runtime.sendMessage(null, {
            type: constants.REQUEST_OPEN_VIDEOS,
        });
    }

    onRequestOpenVideos(callback) {
        this.callbacks.requestOpenVideos = callback;
    }

    sendLocalOpenVideosChange(data) {
        chrome.runtime.sendMessage(null, {
            type: constants.LOCAL_OPEN_VIDEOS_CHANGE,
            data,
        });
    }

    onLocalOpenVideosChange(callback) {
        this.callbacks.localOpenVideosChange.push(callback);
    }

    sendTabOpenVideosChange(tabIds, data) {
        tabIds.forEach(tabId => chrome.tabs.sendMessage(tabId, {
            type: constants.TAB_OPEN_VIDEOS_CHANGE,
            data,
        }));
    }

    onTabOpenVideosChange(callback) {
        this.callbacks.tabOpenVideosChange.push(callback);
    }

    sendBookmarkOpenVideos(tabIds, data) {
        tabIds.forEach(tabId => chrome.tabs.sendMessage(tabId, {
            type: constants.BOOKMARK_OPEN_VIDEO,
            data,
        }));
    }

    onBookmarkOpenVideos(callback) {
        this.callbacks.bookmarkOpenVideos.push(callback);
    }
}
