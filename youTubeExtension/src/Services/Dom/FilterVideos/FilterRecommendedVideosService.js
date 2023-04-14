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
            beforeSelector: '#related',
        });
        this.filterRenderDomEventHandler = new DomEventHandler({
            elementsGetter: FilterRecommendedVideosService.getFilterBaseElement,
            onChange: this.onFilterBaseElementChange.bind(this),
            timeout: 5000,
            notFoundTimeout: 200,
        });
        this.videoContainersDomEventHandler = new DomEventHandler({
            elementsExists: () => false,
            elementsGetter: FilterRecommendedVideosService.getVideoContainers,
            changeDetector: FilterRecommendedVideosService.videoContainersDiffer,
            onChange: this.onVideoContainersChange.bind(this),
            triggerEventOnRunChange: true,
            timeout: 5000,
            notFoundTimeout: 200,
        });

        this.isRunning = false;
        // this.domContainer = null;
        // this.videoContainers = [];
        this.preVideoContainers = [];
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
        return document.querySelector('ytd-watch-flexy > #columns > #secondary > #secondary-inner');
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

    static getVideoContainers() {
        // if (!this.domContainer || !document.contains(this.domContainer)) {
        //     this.domContainer = document.querySelector(
        //         'ytd-watch-flexy > #columns > #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items'
        //     );
        // }
        // if (!this.domContainer) {
        //     return [];
        // }
        const videoContainers = Array.from(document.querySelectorAll('#items > ytd-compact-video-renderer'))
            .map(container => ({
                videoId: getVideoIdFromVideoContainer(container),
                container,
            }));
        return {
            videoContainers,
        };
    }

    static videoContainersDiffer(current, last) {
        if (!current || !last) {
            return current !== last;
        }
        const { videoContainers: newContainers } = current;
        const { videoContainers: oldContainers } = last;
        return newContainers.length !== oldContainers.length || newContainers.some(({ videoId, container }, i) => {
            const oldContainer = oldContainers[i];
            return videoId !== oldContainer.videoId || container !== oldContainer.container;
        });
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

        videoContainers.filter((_, i) => i === 0).forEach(({ container, videoId }) => {
            container.dataset.ytExtensionHidden = this.isFiltered(container, videoId).toString();
        });
    }

    /**
     * Checks if video has to be filtered.
     * @param {Node} container DOM element which contains all elements of a video
     * @returns {boolean} returns true if container should not be visable
     */
    isFiltered(container, videoId) {
        const videoUserState = this.api.getVideoUserStateWithSourcesData(videoId);
        return (
            this.isWatchedFiltered(videoUserState) ||
            this.isActiveFiltered(videoUserState) ||
            this.isOpenFiltered(videoId) ||
            this.isChannelNameFiltered(container) ||
            this.isMusicFiltered(container)
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

    isOpenFiltered(videoId) {
        return this.filter.isOpen !== null && videoId && this.videoOpenStorageService.isVideoOpenFromCache(videoId);
    }

    isChannelNameFiltered(container) {
        if (typeof this.filter.channelName !== 'string') {
            return false;
        }
        const channelName = getChannelName(container);
        return channelName && this.filter.channelName === channelName;
    }

    isMusicFiltered(container) {
        if (this.filter.isMusic === null) {
            return false;
        }
        return !!this.filter.isMusic ^ !getIsMusic(container);
    }

    updateChannels(videoContainers) {
        console.log('updateChannels1', videoContainers.length)
        const channels = videoContainers.map(({ container }) => ({
            channelName: getChannelName(container),
            isMusic: getIsMusic(container),
        })).reduce((map, channel) => {
            const key = `${channel.channelName}|${channel.isMusic}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...channel,
                    count: 0,
                });
            }
            map.get(key).count++;
            return map;
        }, new Map());

        console.log('channels:', channels instanceof Map, channels.size, Array.from(channels.values()), channels)
        triggerEvent(this.channelsChangedEventName, { channels: Array.from(channels.values()) });
    }

    addChannelsChangedEventListener(callback) {
        document.addEventListener(this.channelsChangedEventName, callback);
    }

    removeChannelsChangedEventListener(callback) {
        document.removeEventListener(this.channelsChangedEventName, callback);
    }
}