import DomEventHandler from '../DomEventHandler';


function getCountFactor(container) {
    if (!container.firstElementChild.tagName === 'ytd-rich-grid-row'.toUpperCase()) {
        return 1;
    }
    const firstVideo = container.querySelector('ytd-rich-grid-row > div > ytd-rich-item-renderer');
    return firstVideo && parseInt(firstVideo.getAttribute('items-per-row'), 10) || 1;
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

    static getVideosTab() {
        return document.querySelector('#tabsContent > tp-yt-paper-tab.style-scope:nth-child(4) > div.tab-content.style-scope.tp-yt-paper-tab');
    }

    static getVideoListContainer() {
        return document.querySelector('ytd-browse:not([hidden]) #contents.style-scope.ytd-rich-grid-renderer') ||
            document.querySelector('#items.style-scope.ytd-grid-renderer');
    }

    static getVideosCount(container) {
        const visableElementsCount = isElementHidden(container.lastElementChild) ?
            binarySearchVideosCount(container, 0, container.childElementCount - 1) :
            container.childElementCount;

        const potantialContinuationElement = container.children.item(visableElementsCount - 1);
        const hasContinuationElement = isContinuationElement(potantialContinuationElement) &&
            !isElementHidden(potantialContinuationElement);
        const countFactor = getCountFactor(container);
        console.log('getVideosCount3:', hasContinuationElement, visableElementsCount, countFactor);
        return {
            hasContinuationElement,
            videosCount: (hasContinuationElement ? visableElementsCount - 1 : visableElementsCount) * countFactor,
        };
    }

    static getChannelVideosCount(obj) {
        let { videosTab, videoListContainer } = obj || {};
        videosTab = videosTab instanceof Node && document.contains(videosTab) ?
            videosTab : ChannelVideosDomEventHandler.getVideosTab();
        videoListContainer = videoListContainer instanceof Node && document.contains(videoListContainer) ?
            videoListContainer : ChannelVideosDomEventHandler.getVideoListContainer();

        let videosCount = null;
        let hasVideosFetchingContinuation = null;
        console.log('getChannelVideosCount3:', videoListContainer);
        if (videoListContainer) {
            const count = ChannelVideosDomEventHandler.getVideosCount(videoListContainer);
            videosCount = count.videosCount;
            hasVideosFetchingContinuation = count.hasContinuationElement;
            console.log('getChannelVideosCount4:', videosCount, hasVideosFetchingContinuation);
        }

        return {
            videosTab,
            videoListContainer,
            videosCount,
            hasVideosFetchingContinuation,
        };
    }

    detectChange(newObj, lastObj) {
        return DomEventHandler.detectObjectChange(
            newObj,
            lastObj,
            'videosTab',
            'videoListContainer',
            'hasVideosFetchingContinuation',
            'videosCount',
        );
    }
}