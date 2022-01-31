import DomEventHandler from '../DomEventHandler';


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
        return document.querySelector('#items.style-scope.ytd-grid-renderer');
    }

    static hasContinuationItem(container) {
        return !!container.querySelector('ytd-continuation-item-renderer');
    }

    static getVideosCount(container) {
        const visableElementsCount = isElementHidden(container.lastElementChild) ?
            binarySearchVideosCount(container, 0, container.childElementCount - 1) :
            container.childElementCount;

        return isContinuationElement(container.children.item(visableElementsCount - 1)) ?
            visableElementsCount - 1 : visableElementsCount;
    }

    static getChannelVideosCount(obj) {
        let { videosTab, videoListContainer } = obj || {};
        videosTab = videosTab instanceof Node && document.contains(videosTab) ?
            videosTab : ChannelVideosDomEventHandler.getVideosTab();
        videoListContainer = videoListContainer instanceof Node && document.contains(videoListContainer) ?
            videoListContainer : ChannelVideosDomEventHandler.getVideoListContainer();

        let videosCount = null;
        let hasVideosFetchingContinuation = null;
        if (videoListContainer) {
            videosCount = ChannelVideosDomEventHandler.getVideosCount(videoListContainer);
            const potantialContinuationElement = videoListContainer.children.item(videosCount);
            hasVideosFetchingContinuation = isContinuationElement(potantialContinuationElement) &&
                !isElementHidden(potantialContinuationElement);
        }

        return {
            videosTab,
            videoListContainer,
            videosCount,
            hasVideosFetchingContinuation,
        };
    }

    static getChannelVideosCountChange(newObj, lastObj) {
        return !(newObj === lastObj || (
            newObj && lastObj && [
                'videosTab',
                'videoListContainer',
                'hasVideosFetchingContinuation',
                'videosCount'
            ].every(key => newObj[key] === lastObj[key])
        ));
    }
}