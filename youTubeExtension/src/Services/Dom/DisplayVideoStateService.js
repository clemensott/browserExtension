import React from 'react';
import ReactDOM from 'react-dom';
import getVideoIdFromUrl from '../../utils/getVideoIdFromUrl';
import setIntervalUntil from '../../utils/setIntervalUntil';
import AtOnceService from '../AtOnceService';
import addToggleDisplayVideoState from '../../components/addToggleDisplayVideoState';
import VideoState from '../../components/VideoStates/VideoState';

const videoUserStateClassName = 'yt-video-user-state-container';
const videoUserStateNotCollapse = 'yt-video-user-state-container-not-collapse';

function getCurrentVideoUserStateContainer() {
    return document.querySelector('ytd-video-primary-info-renderer #info');
}

function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail');
    return a && getVideoIdFromUrl(a.href);
}

function getVideoContainers() {
    const currentVideoUserStateContainer = getCurrentVideoUserStateContainer();

    const watchVideos = [{
        container: currentVideoUserStateContainer,
        getVideoId: () => getVideoIdFromUrl(window.location.href),
        additionalClassName: 'yt-video-user-state-watch',
        insertReferenceNodeSelector: '#flex',
    }];

    const listVideos = [
        '#items > ytd-compact-video-renderer',
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
        ...listVideos,
    ];
}

export default class DisplayVideoStateService {
    constructor(api) {
        this.api = api;
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
                this.updateUI(updatedVideoIds);
            } catch (e) {
                console.error('loop error', e)
            }
        });
        this.runLoopNonAsync = this.runLoopNonAsync.bind(this);
    }

    updateUI(videoIdsToUpdate) {
        this.videoContainers.forEach(container => {
            if (container.videoId && (!videoIdsToUpdate?.length || videoIdsToUpdate.includes(container.videoId))) {
                this.updateVideoUserStateUI(container);
            }
        });
    }

    updateVideoUserStateUI({ container, videoId, additionalClassName, insertReferenceNodeSelector = null }) {
        if (!container || !document.contains(container)) {
            return;
        }

        const videoUserState = this.api.videoUserStates[videoId];
        let element = container.querySelector(`.${videoUserStateClassName}`);
        if (!element) {
            element = document.createElement('span');
            element.classList.add(videoUserStateClassName);
            const refNode = insertReferenceNodeSelector && container.querySelector(insertReferenceNodeSelector);
            container.insertBefore(element, refNode);
        }

        const timestamp = videoUserState?.timestamp || 0;
        if (element.dataset.id === videoId && element.dataset.timestamp >= timestamp) {
            return;
        }
        element.dataset.id = videoId;
        element.dataset.timestamp = timestamp;

        ReactDOM.render(
            <VideoState
                videoId={videoId}
                videoUserState={videoUserState}
                additionalClassName={additionalClassName}
                api={this.api}
                onVideoUpdate={() => this.loop.run()}
                onDropdownOpenChange={open => {
                    if (open) {
                        element.classList.add(videoUserStateNotCollapse);
                    } else {
                        element.classList.remove(videoUserStateNotCollapse);
                    }
                }}
            />,
            element,
        );
    }

    runLoopNonAsync() {
        this.loop.run();
    }

    start() {
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

            addToggleDisplayVideoState(element, videoUserStateClassName);
            return false;
        }, 100);

        document.addEventListener('updateSources.startHandleVideos', this.runLoopNonAsync);
        document.addEventListener('updateSources.endHandleVideos', async ({ detail: videos }) => {
            await this.api.updateUserStateOfVideos(videos.map(video => video.id), true);
            this.runLoopNonAsync();
        });
    }
}