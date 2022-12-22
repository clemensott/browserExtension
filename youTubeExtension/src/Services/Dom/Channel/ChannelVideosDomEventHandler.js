import DomEventHandler from '../DomEventHandler';


function getCountFactor(container) {
    switch (container.firstElementChild.tagName.toLowerCase()) {
        case 'ytd-grid-playlist-renderer':
            return 0;
        case 'ytd-rich-grid-row':
            const firstVideo = container.querySelector('ytd-rich-grid-row > div > ytd-rich-item-renderer');
            return firstVideo && parseInt(firstVideo.getAttribute('items-per-row'), 10) || 1;
    }
    return 1;
}

function isContinuationElement(item) {
    return item && item.tagName === 'ytd-continuation-item-renderer'.toUpperCase();
}

function isElementHidden(item) {
    return item && item.hasAttribute('hidden');
}

function binarySearchVideosCount(contianer, minIndex, maxIndex) {
    if (maxIndex - minIndex <= 1) {
        return isElementHidden(contianer.children.item(minIndex)) ? 0 : maxIndex;
    }

    const middleIndex = Math.floor((minIndex + maxIndex) / 2);
    const isMiddleElementHidden = isElementHidden(contianer.children.item(middleIndex));

    return isMiddleElementHidden ?
        binarySearchVideosCount(contianer, minIndex, middleIndex) :
        binarySearchVideosCount(contianer, middleIndex, maxIndex);
}

export default class ChannelVideosDomEventHandler extends DomEventHandler {
    constructor({ updateTrackerService }) {
        super({
            eventName: 'ChannelVideosDomEventHandler.change',
            elementsGetter: ChannelVideosDomEventHandler.getChannelVideosCount,
            elementsExists: () => false,
            changeDetector: ChannelVideosDomEventHandler.getChannelVideosCountChange,
            timeout: 10000,
            notFoundTimeout: 500,
            triggerEventOnRunChange: true,
        });

        this.updateTrackerService = updateTrackerService;
    }

    init() {
        this.updateTrackerService.addVideoDataChangeEventListener(() => {
            setTimeout(() => this.intervalId && this.onTick(), 100);
        });

        this.updateTrackerService.addVideoThumbnailsChangeEventListener(() => {
            if (this.intervalId) {
                this.onTick();
            }
        });
    }

    static getCurrentTab() {
        return document.querySelector('#tabsContent > tp-yt-paper-tab.style-scope.iron-selected > div.tab-content.style-scope.tp-yt-paper-tab');
    }

    static getVideoListContainer() {
        return document.querySelector('ytd-browse:not([hidden]) #contents.style-scope.ytd-rich-grid-renderer') ||
            document.querySelector('#items.style-scope.ytd-grid-renderer');
    }

    static getVideosCount(container) {
        let videoRowsCount = isElementHidden(container.lastElementChild) ?
            binarySearchVideosCount(container, 0, container.childElementCount - 1) :
            container.childElementCount;

        const potantialContinuationElement = container.children.item(videoRowsCount - 1);
        const hasContinuationElement = isContinuationElement(potantialContinuationElement) &&
            !isElementHidden(potantialContinuationElement);
        if (hasContinuationElement) {
            videoRowsCount--;
        }

        let lastRowCount = 0;
        const lastVidoesRow = container.children.item(videoRowsCount - 1);
        if (lastVidoesRow) {
            lastRowCount = lastVidoesRow.querySelectorAll(
                'ytd-rich-grid-row > div > ytd-rich-item-renderer:not([hidden])'
            ).length;
            videoRowsCount--;
        }

        if (videoRowsCount < 0) {
            videoRowsCount = 0;
        }

        const countFactor = getCountFactor(container);
        return {
            hasContinuationElement,
            videosCount: videoRowsCount * countFactor + lastRowCount,
        };
    }

    static getChannelVideosCount(obj) {
        let { tabElement, videoListContainer } = obj || {};
        tabElement = tabElement instanceof Node && document.contains(tabElement) ?
            tabElement : ChannelVideosDomEventHandler.getCurrentTab();
        videoListContainer = videoListContainer instanceof Node && document.contains(videoListContainer) ?
            videoListContainer : ChannelVideosDomEventHandler.getVideoListContainer();

        let videosCount = null;
        let hasVideosFetchingContinuation = null;
        if (videoListContainer) {
            const count = ChannelVideosDomEventHandler.getVideosCount(videoListContainer);
            videosCount = count.videosCount;
            hasVideosFetchingContinuation = count.hasContinuationElement;
        }

        return {
            tabElement,
            videoListContainer,
            videosCount,
            hasVideosFetchingContinuation,
        };
    }

    detectChange(newObj, lastObj) {
        return DomEventHandler.detectObjectChange(
            newObj,
            lastObj,
            'tabElement',
            'videoListContainer',
            'hasVideosFetchingContinuation',
            'videosCount',
        );
    }
}