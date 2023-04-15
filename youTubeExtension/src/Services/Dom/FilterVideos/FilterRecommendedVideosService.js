import React from 'react';
import FilterRecommendedVideos from '../../../components/FilterVideos/FilterRecommendedVideos';
import DomEventHandler from '../DomEventHandler';
import getVideoIdFromUrl from '../../../utils/getVideoIdFromUrl';
import ReactRenderer from '../../../utils/ReactRenderer';
import triggerEvent from '../../../utils/triggerEvent';
import randomString from '../../../utils/randomString';
import './FilterRecommendedVideosService.css';


function getChannelName(container) {
    const channelNameElement = container.querySelector(
        '#metadata > #byline-container > #channel-name > #container > #text-container > #text',
    );
    return channelNameElement ? channelNameElement.innerText : null;
}

function getIsMusic(container) {
    return !!container.querySelector(
        '#channel-name > ytd-badge-supported-renderer > div[aria-label="Official Artist Channel"]',
    );
}

function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail');
    return a && a.href && getVideoIdFromUrl(a.href);
}

export default class FilterRecommendedVideosService {
    constructor({ videoOpenStorageService }) {
        this.api = null;
        this.videoOpenStorageService = videoOpenStorageService;

        this.filterRenderer = new ReactRenderer({
            id: 'yt-extension-filter-recommended-videos-container',
            beforeSelector: 'ytd-item-section-renderer,#related',
        });
        this.filterRenderDomEventHandler = new DomEventHandler({
            elementsGetter: FilterRecommendedVideosService.getFilterBaseElement,
            onChange: this.onFilterBaseElementChange.bind(this),
            timeout: 5000,
            notFoundTimeout: 200,
        });
        this.videoContainersDomEventHandler = new DomEventHandler({
            elementsExists: FilterRecommendedVideosService.getVideoContainersSame,
            elementsGetter: FilterRecommendedVideosService.getVideoContainers,
            changeDetector: FilterRecommendedVideosService.videoContainersDiffer,
            onChange: this.onVideoContainersChange.bind(this),
            triggerEventOnRunChange: true,
            timeout: 200,
        });

        this.isRunning = false;
        this.filter = {
            isWatchted: null,
            isActive: null,
            isOpen: null,
            channelName: null,
            isMusic: null,
        };
        this.channelsChangedEventName = `FilterRecommendedVideosService.${randomString()}.channels_changed`;

        this.onUserStateOfVideoChanged = this.onUserStateOfVideoChanged.bind(this);
        this.onVideoOpenStateChanged = this.onVideoOpenStateChanged.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.subscribe();
        this.filterRenderDomEventHandler.start();
        this.videoContainersDomEventHandler.start();

        this.isRunning = true;
    }

    stop() {
        this.api?.removeUpdateUserStateOfVideosEventListener(this.onUserStateOfVideoChanged);
        // unsubscribe to video open changed

        // this.videoContainers.forEach(({ container }) => {
        //     delete container.dataset.ytExtensionHidden;
        // });
        this.isRunning = false;
    }

    setApiHandler(api) {
        this.api = api;

        if (this.isRunning) {
            this.subscribe();
            this.filterLastContainers();
        }
    }

    subscribe() {
        if (this.api) {
            this.api.addUpdateUserStateOfVideosEventListener(this.onUserStateOfVideoChanged);
            // subscribe to video open changed
        }
    }

    static getFilterBaseElement() {
        const sibling = document.querySelector(
            'ytd-watch-flexy > #columns > #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items > ytd-item-section-renderer'
        ) || document.querySelector('ytd-watch-flexy > #columns > #secondary > #secondary-inner > #related');
        return sibling && sibling.parentElement;
    }

    onFilterBaseElementChange({ currentElements: baseElement }) {
        if (baseElement) {
            this.filterRenderer.render(
                <FilterRecommendedVideos
                    eventProvider={this}
                    onFilterChange={this.onFilterChange}
                />,
                baseElement,
            );
        } else {
            this.filterRenderer.unmount();
        }
    }

    static isVideoIdUpToDate({ container, videoId }) {
        const currentVideoId = getVideoIdFromVideoContainer(container);
        return currentVideoId === videoId;
    }

    static getVideoContainersSame(last) {
        if (!last) {
            return false;
        }
        const { domContainer, childrenCount, timestamp, videoContainers } = last;
        return (
            Date.now() > timestamp + 5000 &&
            domContainer instanceof Node &&
            domContainer.childElementCount === childrenCount &&
            !document.contains(domContainer) &&
            videoContainers.length !== 0 &&
            FilterRecommendedVideosService.isVideoIdUpToDate(videoContainers[0]) &&
            FilterRecommendedVideosService.isVideoIdUpToDate(videoContainers[videoContainers.length - 1])
        );
    }

    static getVideoContainersContainer() {
        return document.querySelector('#items > ytd-item-section-renderer > #contents') ||
            document.querySelector('ytd-watch-next-secondary-results-renderer > #items');
    }

    static getVideoContainers() {
        const domContainer = FilterRecommendedVideosService.getVideoContainersContainer();
        const videoContainers = domContainer && Array.from(domContainer.querySelectorAll('ytd-compact-video-renderer'))
            .map(container => ({
                videoId: getVideoIdFromVideoContainer(container),
                channelName: getChannelName(container),
                isMusicChannel: getIsMusic(container),
                container,
            })) || [];
        return {
            domContainer,
            childrenCount: domContainer ? domContainer.childElementCount : -1,
            timestamp: Date.now(),
            videoContainers,
        };
    }

    static videoContainersDiffer(current, last) {
        if (current === last) {
            return false;
        }
        if (!current || !last) {
            return current !== last;
        }
        const { videoContainers: newContainers } = current;
        const { videoContainers: oldContainers } = last;
        return (
            newContainers.length !== oldContainers.length ||
            newContainers.some(({ videoId, channelName, isMusicChannel, container }, i) => {
                const oldContainer = oldContainers[i];
                return (
                    videoId !== oldContainer.videoId ||
                    channelName !== oldContainer.channelName ||
                    isMusicChannel !== oldContainer.isMusicChannel ||
                    container !== oldContainer.container
                );
            })
        );
    }

    onUserStateOfVideoChanged({ detail: { videoIds } }) {
        this.filterLastContainers();
    }

    onVideoOpenStateChanged() {
        this.filterLastContainers();
    }

    onFilterChange(filter) {
        this.filter = {
            ...this.filter,
            ...filter,
        };
        this.filterLastContainers();
    }

    filterLastContainers() {
        this.filterContainers(this.videoContainersDomEventHandler.lastElements, null);
    }

    onVideoContainersChange({ currentElements, lastElements }) {
        this.filterContainers(currentElements, lastElements);
        this.updateChannels(currentElements?.videoContainers || []);
    }

    filterContainers(currentElements, lastElements) {
        if (!this.api || !currentElements) {
            return;
        }

        const { videoContainers } = currentElements;
        if (lastElements) {
            lastElements.videoContainers
                .map(({ container }) => container)
                .filter((container, i) => (
                    container !== videoContainers[i] || !videoContainers.some(vc => vc.container !== container)
                ))
                .forEach(container => {
                    delete container.dataset.ytExtensionHidden;
                });
        }

        videoContainers
            // .filter((_, i) => i === 0)
            .forEach(videoContainer => {
                const filter = !!this.isFiltered(videoContainer);
                videoContainer.container.dataset.ytExtensionHidden = filter.toString();
            });
    }

    /**
     * Checks if video has to be filtered.
     * @param {Node} container DOM element which contains all elements of a video
     * @returns {boolean} returns true if container should not be visable
     */
    isFiltered(videoContainer) {
        const videoUserState = this.api.getVideoUserStateWithSourcesData(videoContainer.videoId);
        return (
            this.isWatchedFiltered(videoUserState) ||
            this.isActiveFiltered(videoUserState) ||
            this.isOpenFiltered(videoContainer) ||
            this.isChannelNameFiltered(videoContainer) ||
            this.isMusicFiltered(videoContainer)
        );
    }

    isWatchedFiltered(videoUserState) {
        return this.filter.isWatchted !== null && videoUserState && this.filter.isWatchted !== videoUserState.isWatched;
    }

    isActiveFiltered(videoUserState) {
        if (this.filter.isActive === null || !videoUserState) {
            return false;
        }
        return this.filter.isActive ?
            videoUserState.sources.some(vus => vus.isActive) :
            videoUserState.sources.every(vus => !vus.isActive);
    }

    isOpenFiltered({ videoId }) {
        return this.filter.isOpen !== null && videoId && !!this.filter.isOpen !== !!this.videoOpenStorageService.isVideoOpenFromCache(videoId);
    }

    isChannelNameFiltered({ channelName }) {
        if (typeof this.filter.channelName !== 'string') {
            return false;
        }
        return channelName && this.filter.channelName !== channelName;
    }

    isMusicFiltered({ isMusicChannel }) {
        if (this.filter.isMusic === null) {
            return false;
        }
        return !!this.filter.isMusic !== isMusicChannel;
    }

    updateChannels(videoContainers) {
        const channels = videoContainers.reduce((map, container) => {
            const key = `${container.channelName}|${container.isMusic}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...container,
                    count: 0,
                });
            }
            map.get(key).count++;
            return map;
        }, new Map());

        triggerEvent(this.channelsChangedEventName, { channels: Array.from(channels.values()) });
    }

    addChannelsChangedEventListener(callback) {
        document.addEventListener(this.channelsChangedEventName, callback);
    }

    removeChannelsChangedEventListener(callback) {
        document.removeEventListener(this.channelsChangedEventName, callback);
    }
}