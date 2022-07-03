import getVideoIdFromUrl from '../../../utils/getVideoIdFromUrl';
import getCurrentVideoId from '../../../utils/getCurrentVideoId';
import setIntervalUntil from '../../../utils/setIntervalUntil';
import AtOnceService from '../../AtOnceService';
import addToggleDisplayVideoState from '../../../components/addToggleDisplayVideoState';
import VideoOverlayRenderer from './VideoOverlayRenderer';
import './VideoOverlayService.css';

const videoStateContainerClassName = 'yt-video-user-state-container';
const videoOpenContainerClassName = 'yt-video-open-container';

function getVideoIdOfShortVideoContainer(container) {
    let parent = container;
    while (parent && parent.tagName !== 'YTD-REEL-VIDEO-RENDERER') {
        parent = parent.parentElement;
    }
    const videoContainer = parent && parent.querySelector('div[id^="player-container"');
    const match = videoContainer &&
        videoContainer.style['background-image'] &&
        videoContainer.style['background-image'].match(/\/vi\/([a-zA-Z0-9-_]*)\//);
    return match && match[1] || (
        parent && parent.id === '0' ? getCurrentVideoId() : null
    );
}

function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail');
    return a && a.href && getVideoIdFromUrl(a.href);
}

function getVideoContainers() {
    const watchVideos = [{
        container: document.querySelector(
            '#owner-and-teaser'
        ) || document.querySelector(
            'ytd-video-primary-info-renderer #info'
        ),
        getVideoId: () => getCurrentVideoId(),
        additionalClassName: 'yt-video-user-state-watch',
        insertReferenceNodeSelector: '#comment-teaser, #flex',
    }];

    const shortVideos = [
        'ytd-reel-player-overlay-renderer > #actions.style-scope.ytd-reel-player-overlay-renderer',
    ]
        .map(selector => Array.from(document.querySelectorAll(selector))).flat()
        .map(container => ({
            container,
            getVideoId: () => getVideoIdOfShortVideoContainer(container),
            additionalClassName: 'yt-video-user-state-watch',
        }));

    const listVideos = [
        '#items > ytd-compact-video-renderer',
        '#contents > ytd-compact-video-renderer',
        '#items > ytd-grid-video-renderer',
        '#contents > ytd-rich-item-renderer',
        '#contents > ytd-video-renderer',
        '#items > ytd-video-renderer',
        '#items > ytd-playlist-panel-video-renderer',
    ]
        .map(selector => Array.from(document.querySelectorAll(selector))).flat()
        .map(container => ({
            container,
            getVideoId: () => getVideoIdFromVideoContainer(container),
            additionalClassName: 'yt-video-user-state-list-item',
        }));

    return [
        ...watchVideos,
        ...shortVideos,
        ...listVideos,
    ];
}

export default class DisplayVideoStateService {
    constructor(api, videoOpenStorageService) {
        this.api = api;
        this.videoOpenStorageService = videoOpenStorageService;
        this.videoContainers = null;
        this.loop = new AtOnceService(async (fast = false, forceUserStateUpdate = false) => {
            try {
                if (!fast || !this.videoContainers) {
                    this.videoContainers = getVideoContainers();
                }
                this.videoContainers.forEach(container => container.videoId = container.getVideoId());
                this.updateUI();

                const videoIds = this.videoContainers.map(c => c.videoId).filter(Boolean);
                const updatedVideoIds = await this.api.updateUserStateOfVideos(videoIds, forceUserStateUpdate);
                if (updatedVideoIds) {
                    await this.loadSourcesOfVideos(updatedVideoIds);
                }
                this.updateUI(updatedVideoIds);
            } catch (e) {
                console.error('loop error', e)
            }
        });
        this.runLoopNonAsync = this.runLoopNonAsync.bind(this);
        this.overlayRender = new VideoOverlayRenderer({
            api,
            videoOpenStorageService,
            videoStateContainerClassName,
            videoOpenContainerClassName,
            onUpdate: this.runLoopNonAsync,
        });
    }

    loadSourcesOfVideos(videoIds) {
        const sourceIds = (videoIds || [])
            .map(videoId => this.api.getVideoUserState(videoId))
            .filter(Boolean)
            .map(state => state.sources)
            .filter(Boolean)
            .flat()
            .map(s => s.sourceId);

        return this.api.loadSources(sourceIds);
    }

    updateUI(videoIdsToUpdate) {
        this.videoContainers.forEach(container => {
            if (container.videoId && (!videoIdsToUpdate?.length || videoIdsToUpdate.includes(container.videoId))) {
                this.overlayRender.render(container);
            }
        });
    }

    runLoopNonAsync() {
        this.loop.run();
    }

    start() {
        document.body.classList.add('yt-extension-display-video-states');
        setInterval(() => this.loop.run({ optional: true, params: [false] }), 200);
        setInterval(() => this.loop.run({ optional: true }), 5000);

        window.onfocus = async () => {
            await this.loop.run({ params: [false, true] });
        };

        setIntervalUntil(() => {
            if (!getVideoContainers().length) return true;

            this.loop.run();
            return false;
        }, 100);

        setIntervalUntil(() => {
            const element = document.getElementById('voice-search-button');
            if (!element) return true;

            addToggleDisplayVideoState(element, [videoStateContainerClassName, videoOpenContainerClassName]);
            return false;
        }, 100);

        document.addEventListener('updateSources.startHandleVideos', this.runLoopNonAsync);
        document.addEventListener('updateSources.endHandleVideos', async ({ detail: videos }) => {
            await this.api.updateUserStateOfVideos(videos.map(video => video.id), true);
            this.runLoopNonAsync();
        });
    }
}