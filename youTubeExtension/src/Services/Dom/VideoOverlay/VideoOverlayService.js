import getVideoIdFromVideoContainer from '../../../utils/getVideoIdFromVideoContainer';
import getCurrentVideoId from '../../../utils/getCurrentVideoId';
import setIntervalUntil from '../../../utils/setIntervalUntil';
import AtOnceService from '../../AtOnceService';
import addToggleDisplayVideoState from '../../../components/addToggleDisplayVideoState';
import VideoOverlayRenderer from './VideoOverlayRenderer';
import getVideoIdFromUrl from '../../../utils/getVideoIdFromUrl';
import './VideoOverlayService.css';

const videoStateContainerClassName = 'yt-video-user-state-container';
const videoOpenContainerClassName = 'yt-video-open-container';

function getVideoIdOfShortVideoContainer(container) {
    let parent = container;
    while (parent && parent.tagName !== 'YTD-REEL-VIDEO-RENDERER') {
        parent = parent.parentElement;
    }
    const titleContainer = parent.querySelector('[data-sessionlink="feature=player-title"][href],.ytp-title-link.yt-uix-sessionlink[href]');
    if (titleContainer && titleContainer.href) {
        const videoId = getVideoIdFromUrl(titleContainer.href);
        if (videoId) {
            return videoId;
        }
    }
    const videoContainer = parent && parent.querySelector('div[id^="player-container"');
    const match = videoContainer &&
        videoContainer.style['background-image'] &&
        videoContainer.style['background-image'].match(/\/vi\/([a-zA-Z0-9-_]*)\//);
    return match && match[1];
}

function getWatchVideoContainer() {
    return [...document.querySelectorAll(
        '#title > h1,#owner-and-teaser,ytd-video-primary-info-renderer #info'
    )].find(container => {
        let current = container;
        while (current) {
            if (current.hasAttribute('hidden')) {
                return false;
            }

            current = current.parentElement;
        }

        return true;
    });
}

export default class VideoOverlayService {
    constructor({ api, videoOpenService }) {
        this.api = api;
        this.videoOpenService = videoOpenService;

        this.videoContainers = null;
        this.loop = new AtOnceService(this.loopHandle.bind(this));
        this.runLoopNonAsync = this.runLoopNonAsync.bind(this);
        this.overlayRender = new VideoOverlayRenderer({
            api,
            videoOpenService,
            videoStateContainerClassName,
            videoOpenContainerClassName,
        });
        this.updateBroadcast = new BroadcastChannel('updateSources');
        this.videoStateBroadcast = new BroadcastChannel('videoState');
    }

    async loopHandle(fast = false, forceUserStateUpdate = false) {
        try {
            if (!fast || !this.videoContainers) {
                this.videoContainers = VideoOverlayService.getVideoContainers();
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
    }

    static getVideoContainers() {
        const watchContainer = getWatchVideoContainer();
        const watchVideos = watchContainer ? [{
            container: watchContainer,
            getVideoId: () => getCurrentVideoId(),
            additionalClassName: 'yt-video-user-state-watch',
            insertReferenceNodeSelector: '#comment-teaser, #flex',
            addRootContainerClass: 'yt-video-user-state-watch-root',
        }] : [];

        const shortWatchVideos = [
            'div#actions.ytd-reel-player-overlay-renderer',
        ]
            .flatMap(selector => Array.from(document.querySelectorAll(selector)))
            .map(container => ({
                container,
                getVideoId: () => getVideoIdOfShortVideoContainer(container),
                additionalClassName: 'yt-video-user-state-watch',
                addRootContainerClass: 'yt-video-user-state-watch-root',
            }));

        const shortVideos = [
            'ytd-reel-player-overlay-renderer > #actions.style-scope.ytd-reel-player-overlay-renderer',
        ]
            .flatMap(selector => Array.from(document.querySelectorAll(selector)))
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
            '#contents > ytd-playlist-video-renderer',
            '#items > yt-lockup-view-model',
            '#contents > yt-lockup-view-model',
        ]
            .flatMap(selector => Array.from(document.querySelectorAll(selector)))
            .map(container => ({
                container,
                getVideoId: () => getVideoIdFromVideoContainer(container),
                additionalClassName: 'yt-video-user-state-list-item',
            }));

        return [
            ...watchVideos,
            ...shortWatchVideos,
            ...shortVideos,
            ...recommendedVideos,
            ...listVideos,
        ];
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
            if (!VideoOverlayService.getVideoContainers().length) return true;

            this.loop.run();
            return false;
        }, 100);

        setIntervalUntil(() => {
            const element = document.getElementById('voice-search-button');
            if (!element) return true;

            addToggleDisplayVideoState(element, [videoStateContainerClassName, videoOpenContainerClassName]);
            return false;
        }, 100);

        this.updateBroadcast.addEventListener('message', async ({ data }) => {
            switch (data.type) {
                case 'startHandleVideos':
                    await this.api.updateUserStateOfVideos(data.videos.map(video => video.id));
                    return this.runLoopNonAsync();
                case 'endHandleVideos':
                    await this.api.updateUserStateOfVideos(data.videos.map(video => video.id), true);
                    return this.runLoopNonAsync();
            }
        });
        this.videoStateBroadcast.addEventListener('message', async ({ data }) => {
            await this.api.updateUserStateOfVideos([data.videoId], true);
            return this.runLoopNonAsync();
        });
    }
}