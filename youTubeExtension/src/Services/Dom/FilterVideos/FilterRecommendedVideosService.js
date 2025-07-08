import FilterRecommendedVideos from '../../../components/FilterVideos/FilterRecommendedVideos';
import DomEventHandler from '../DomEventHandler';
import getVideoIdAndTypeFromContainer from '../../../utils/getVideoIdAndTypeFromContainer';
import getVideoIdFromVideoContainer from '../../../utils/getVideoIdFromVideoContainer';
import ReactRenderer from '../../../utils/ReactRenderer';
import triggerEvent from '../../../utils/triggerEvent';
import randomString from '../../../utils/randomString';
import RootElement from '../../../components/RootElement';
import './FilterRecommendedVideosService.css';


function getChannelName(container) {
    const channelNameElement = container.querySelector(
        '#metadata > #byline-container > #channel-name > #container > #text-container > #text,yt-lockup-metadata-view-model > div > span.yt-core-attributed-string,yt-content-metadata-view-model > div > span.yt-core-attributed-string',
    );
    return channelNameElement ? channelNameElement.innerText : null;
}

function getIsMusic(container) {
    return !!container.querySelector(
        '#channel-name > ytd-badge-supported-renderer > div[aria-label="Official Artist Channel"],yt-lockup-metadata-view-model > div span.yt-icon-shape.yt-spec-icon-shape',
    );
}

function getVideoContainerTitle(container) {
    const titleElement = container.querySelector('span#video-title,a.yt-lockup-metadata-view-model-wiz__title');
    return titleElement ? titleElement.innerText : '';
}

function normalizeDuration(text) {
    const parts = text.trim().split(':');
    let hours, minutes, seconds;
    if (parts.length === 2) {
        hours = '';
        minutes = parts[0];
        seconds = parts[1];
    } else if (parts.length === 3) {
        hours = parts[0];
        minutes = parts[1];
        seconds = parts[2];
    } else {
        return '';
    }

    return `${hours.padStart(5, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

function getVideoContainerDuration(container) {
    const durationElement = container.querySelector('ytd-thumbnail-overlay-time-status-renderer #text, yt-thumbnail-view-model div.badge-shape-wiz__text');
    return durationElement ? normalizeDuration(durationElement.innerText) : '';
}

export default class FilterRecommendedVideosService {
    constructor({ videoOpenService }) {
        this.api = null;
        this.videoOpenService = videoOpenService;

        this.filterRenderer = new ReactRenderer({
            id: 'yt-extension-filter-recommended-videos-root',
            beforeSelector: '#related,#items',
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
            isWatched: null,
            isActive: null,
            isOpen: null,
            channels: [],
            type: null,
            title: null,
        };

        this.channels = [];
        this.channelsChangedEventName = `FilterRecommendedVideosService.${randomString()}.channels_changed`;

        this.actions = {
            isLoadVideos: false,
            sorting: [],
        };

        this.onUserStateOfVideoChanged = this.onUserStateOfVideoChanged.bind(this);
        this.onVideoOpenStateChanged = this.onVideoOpenStateChanged.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
        this.onActionsChange = this.onActionsChange.bind(this);
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
        this.unsubscribe();
        this.filterRenderDomEventHandler.start();
        this.videoContainersDomEventHandler.start();

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
            this.videoOpenService.addOpenChangedEventListener(this.onVideoOpenStateChanged);
        }
    }

    unsubscribe() {
        this.api?.removeUpdateUserStateOfVideosEventListener(this.onUserStateOfVideoChanged);
        this.videoOpenService.removeOpenChangedEventListener(this.onVideoOpenStateChanged);
    }

    static getFilterBaseElement() {
        const sibling = document.querySelector(
            'ytd-watch-flexy > #columns > #secondary > #secondary-inner > #related > ytd-watch-next-secondary-results-renderer > #items'
        ) || document.querySelector('ytd-watch-flexy > #columns > #secondary > #secondary-inner > #related');
        return sibling && sibling.parentElement;
    }

    onFilterBaseElementChange({ currentElements: baseElement }) {
        if (baseElement) {
            this.filterRenderer.render(
                RootElement(FilterRecommendedVideos, {
                    eventProvider: this,
                    onFilterChange: this.onFilterChange,
                    onActionsChange: this.onActionsChange,
                }),
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
        const videoContainers = domContainer && Array.from(domContainer.querySelectorAll(
            'ytd-compact-video-renderer,ytd-compact-playlist-renderer,ytd-compact-movie-renderer,yt-lockup-view-model',
        )).map(container => {
            const { videoId, type } = getVideoIdAndTypeFromContainer(container);
            return {
                videoId,
                channelName: getChannelName(container),
                isMusicChannel: getIsMusic(container),
                type,
                title: getVideoContainerTitle(container),
                duration: getVideoContainerDuration(container),
                container,
            };
        }) || [];
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
        this.filterLastContainers(videoIds);
    }

    onVideoOpenStateChanged({ detail: { closedVideoIds, openedVideoIds } }) {
        this.filterLastContainers(new Set([
            ...closedVideoIds,
            ...openedVideoIds,
        ]));
    }

    onFilterChange(filter) {
        Object.assign(this.filter, filter);
        this.filterLastContainers();
    }

    filterLastContainers(videoIds = null) {
        this.filterContainers(this.videoContainersDomEventHandler.currentElements, null, videoIds);
    }

    onVideoContainersChange({ currentElements, lastElements }) {
        this.filterContainers(currentElements, lastElements);
        this.sortContainers(currentElements, lastElements);
        this.updateChannels(currentElements?.videoContainers || []);
    }

    filterContainers(currentElements, lastElements, videoIds = null) {
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

        const videoContainersToUpdate = videoIds ?
            videoContainers.filter(({ videoId }) => videoIds.has(videoId)) : videoContainers;
        videoContainersToUpdate
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
            this.isChannelFiltered(videoContainer) ||
            this.isTypeFiltered(videoContainer) ||
            this.isTitleFiltered(videoContainer)
        );
    }

    isWatchedFiltered(videoUserState) {
        const videoIsWatched = videoUserState && typeof videoUserState.isWatched === 'boolean' ?
            videoUserState.isWatched : false;
        return this.filter.isWatched !== null && this.filter.isWatched !== videoIsWatched;
    }

    isActiveFiltered(videoUserState) {
        if (this.filter.isActive === null || !videoUserState || !videoUserState.sources) {
            return false;
        }
        return this.filter.isActive ?
            videoUserState.sources.every(vus => !vus.isActive) :
            videoUserState.sources.some(vus => vus.isActive);
    }

    isOpenFiltered({ videoId }) {
        return (
            this.filter.isOpen !== null
            && videoId
            && !!this.filter.isOpen !== !!this.videoOpenService.isVideoOpenFromCache(videoId).length
        );
    }

    isChannelFiltered({ channelName, isMusicChannel }) {
        if (!this.filter.channels || !this.filter.channels.length) {
            return false;
        }
        return !this.filter.channels.some(c => c.channelName === channelName && c.isMusicChannel === isMusicChannel);
    }

    isTypeFiltered({ type }) {
        if (this.filter.type === null) {
            return false;
        }
        return this.filter.type !== type;
    }

    isTitleFiltered({ title }) {
        if (this.filter.title === null) {
            return false;
        }
        return !title.toLowerCase().includes(this.filter.title.toLowerCase());
    }

    onActionsChange(actions) {
        Object.assign(this.actions, actions);
        if ('sorting' in actions) {
            this.sortLastContainers();
        }
        this.handleLoadVideos();
    }

    sortLastContainers() {
        this.sortContainers(this.videoContainersDomEventHandler.currentElements, null);
    }

    sortContainers(currentElements, lastElements) {
        if (lastElements) {
            lastElements.videoContainers.forEach(({ container }) => {
                container.style.removeProperty('order');
            });
        }

        if (!currentElements) {
            return;
        }

        if (!this.actions.sorting.length) {
            currentElements.videoContainers.forEach(({ container }) => {
                container.style.removeProperty('order');
            });
            return;
        }

        const videoContainers = Array.from(currentElements.videoContainers);
        videoContainers.sort((a, b) => this.compareContainers(a, b));
        videoContainers.forEach(({ container }, index) => container.style.order = index.toString());
    }

    compareContainers(a, b) {
        for (const sortValue of this.actions.sorting) {
            const [sortType, sortDirection] = sortValue.split('_');

            let compareValue;
            switch (sortType) {
                case 'title':
                    compareValue = FilterRecommendedVideosService.compareTitle(a, b);
                    break;
                case 'channel':
                    compareValue = FilterRecommendedVideosService.compareChannelName(a, b);
                    break;
                case 'duration':
                    compareValue = FilterRecommendedVideosService.compareDuration(a, b);
                    break;
                case 'type':
                    compareValue = FilterRecommendedVideosService.compareType(a, b);
                    break;
            }

            if (compareValue === 0) {
                continue;
            }

            if (sortDirection === 'desc') {
                compareValue = compareValue * -1;
            }
            return compareValue;
        }
    }

    static compareTitle({ title: a }, { title: b }) {
        return a.localeCompare(b);
    }

    static compareChannelName({ channelName: a }, { channelName: b }) {
        return a.localeCompare(b);
    }

    static compareDuration({ duration: a }, { duration: b }) {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b);
    }

    static compareType({ type: a }, { type: b }) {
        const valueA = FilterRecommendedVideosService.getTypeOrderValue(a);
        const valueB = FilterRecommendedVideosService.getTypeOrderValue(b);
        return valueA - valueB;
    }

    static getTypeOrderValue(type) {
        switch (type) {
            case 'short':
                return 1;
            case 'video':
                return 2;
            case 'playlist':
                return 3;
            case 'movie':
                return 4;
            default:
                return 5;
        }
    }

    handleLoadVideos() {
        const loadVideosClassName = 'yt-extension-load-recommanded-videos';
        const container = FilterRecommendedVideosService.getVideoContainersContainer();
        if (this.actions.isLoadVideos) {
            container?.classList.add(loadVideosClassName);
        } else {
            container?.classList.remove(loadVideosClassName);
        }
    }

    updateChannels(videoContainers) {
        if (!videoContainers) {
            videoContainers = [];
        }
        const channels = videoContainers.reduce((map, container) => {
            const key = `${container.channelName}|${container.isMusicChannel}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...container,
                    count: 0,
                });
            }
            map.get(key).count++;
            return map;
        }, new Map());

        this.channels = Array.from(channels.values());
        triggerEvent(this.channelsChangedEventName, { channels: this.channels });
    }

    getFilter() {
        return {
            ...this.filter,
        };
    }

    getChannels() {
        return [...this.channels];
    }

    getActions() {
        return {
            ...this.actions,
        };
    }

    addChannelsChangedEventListener(callback) {
        document.addEventListener(this.channelsChangedEventName, callback);
    }

    removeChannelsChangedEventListener(callback) {
        document.removeEventListener(this.channelsChangedEventName, callback);
    }
}