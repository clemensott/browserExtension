import DomEventHandler from '../DomEventHandler';


function getCountFactor(container) {
    const firstRow = container.firstElementChild;
    switch (firstRow.tagName.toLowerCase()) {
        case 'ytd-grid-playlist-renderer':
            return 0;
        case 'ytd-rich-grid-row':
            const itemsPerRowPropName = firstRow.hasAttribute('is-shorts-grid') ?
                '--ytd-rich-grid-slim-items-per-row' : '--ytd-rich-grid-items-per-row';
            const itemsPerRow = container.parentElement.style.getPropertyValue(itemsPerRowPropName);
            return itemsPerRow && parseInt(itemsPerRow, 10) || 1;
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

    static isCurrentTab(tab) {
        return tab instanceof Node &&
            document.contains(tab) &&
            tab.parentElement instanceof Node &&
            tab.parentElement.classList.contains('yt-tab-shape-wiz__tab--tab-selected');
    }

    static getCurrentTab() {
        return document.querySelector(
            '#tabsContent > yt-tab-group-shape > div.yt-tab-group-shape-wiz__tabs > yt-tab-shape > div.yt-tab-shape-wiz__tab.yt-tab-shape-wiz__tab--tab-selected'
        )?.parentElement;
    }

    static isCurrentVideoListContainer(container) {
        return container instanceof Node &&
            document.contains(container);
    }

    static getCurrentVideoListContainer() {
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
        if (!hasContinuationElement) {
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
        }

        const countFactor = getCountFactor(container);
        return {
            hasContinuationElement,
            videosCount: videoRowsCount * countFactor + lastRowCount,
        };
    }

    static getChannelVideosCount(obj) {
        let { tabElement, videoListContainer } = obj || {};
        tabElement = ChannelVideosDomEventHandler.isCurrentTab(tabElement) ?
            tabElement : ChannelVideosDomEventHandler.getCurrentTab();
        videoListContainer = ChannelVideosDomEventHandler.isCurrentVideoListContainer(videoListContainer) ?
            videoListContainer : ChannelVideosDomEventHandler.getCurrentVideoListContainer();

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