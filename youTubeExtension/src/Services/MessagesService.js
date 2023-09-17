const constants = {
    REQUEST_OPEN_VIDEOS: 'request_open_videos',
    DISCARDED_OPEN_VIDEO: 'discarded_open_videos',
    BOOKMARK_OPEN_VIDEO: 'bookmark_open_videos',
};

export default class MessagesService {
    constructor() {
        this.callbacks = {
            requestOpenVideos: null,
            discardedOpenVideos: [],
            bookmarkOpenVideos: [],
        };

        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    }

    onMessage(message, _, sendResponse) {
        switch (message.type) {
            case constants.REQUEST_OPEN_VIDEOS:
                (async () => sendResponse(await this.callbacks.requestOpenVideos()))();
                return true;
            case constants.DISCARDED_OPEN_VIDEO:
                this.callbacks.discardedOpenVideos.forEach(callback => callback(message.data));
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

    sendDiscardedOpenVideos(tabIds, data) {
        tabIds.forEach(tabId => chrome.tabs.sendMessage(tabId, {
            type: constants.DISCARDED_OPEN_VIDEO,
            data,
        }));
    }

    onDiscardedOpenVideos(callback) {
        this.callbacks.discardedOpenVideos.push(callback);
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