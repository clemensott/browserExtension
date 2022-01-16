import getVideoIdFromUrl from '../utils/getVideoIdFromUrl';
import setIntervalUntil from '../utils/setIntervalUntil';
import AtOnceService from './AtOnceService';
import addToggleDisplayVideoState from '../components/addToggleDisplayVideoState';
import './DisplayVideoStateService.css';

const videoUserStateClassName = 'yt-video-user-state-container';

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
            element.classList.add(additionalClassName);
            const refNode = insertReferenceNodeSelector && container.querySelector(insertReferenceNodeSelector);
            container.insertBefore(element, refNode);
        }

        const timestamp = videoUserState?.timestamp || 0;
        if (element.dataset.id === videoId && element.dataset.timestamp >= timestamp) {
            return;
        }
        element.dataset.id = videoId;
        element.dataset.timestamp = timestamp;

        const classNames = {
            unkown: 'yt-video-user-state-unkown',
            missing: 'yt-video-user-state-missing',
            watched: 'yt-video-user-state-watched',
            active: 'yt-video-user-state-active',
            inactive: 'yt-video-user-state-inactive',
            inactiveDepricated: 'yt-video-user-state-inactive-depricated',
            count: 'yt-video-user-state-count',
        }
        let className = '';
        let innerText = '';

        if (!videoUserState) {
            innerText = '\u2370';
            className = classNames.unkown;
        } else if (!videoUserState?.sources?.length) {
            element.innerHTML = '<div class="yt-video-user-state-action-button" />';

            className = classNames.missing;
        } else {
            function addButtonToElement({ innerText, title, className, onclick }) {
                const button = document.createElement('div');
                if (innerText) button.innerText = innerText;
                if (title) button.title = title;
                button.classList.add('yt-video-user-state-action-button');
                if (className) button.classList.add(className);
                button.onclick = onclick;
                element.appendChild(button);
            }

            const wrapFunction = func => {
                return async () => {
                    try {
                        await func();
                        await this.api.updateUserStateOfVideos([videoId], true);
                        await this.loop.run();
                    } catch (e) {
                        console.error('delete video error', e);
                    }
                };
            }

            const buttonOptions = {
                setWatchedAndInactive: sourceIds => addButtonToElement({
                    innerText: '\u2705',
                    title: 'Set watched and inactive!',
                    onclick: wrapFunction(() => {
                        return Promise.all([
                            this.api.updateUserVideo(videoId, true),
                            this.api.deactivateVideo(videoId, sourceIds),
                        ]);
                    }),
                }),
                setWatched: () => addButtonToElement({
                    innerText: '\u2713',
                    title: 'Set watched!',
                    onclick: wrapFunction(() => {
                        return this.api.updateUserVideo(videoId, true);
                    }),
                }),
                setNotWatched: () => addButtonToElement({
                    innerText: '\u274C',
                    title: 'Set not watched!',
                    onclick: wrapFunction(() => {
                        return this.api.updateUserVideo(videoId, false);
                    }),
                }),
                setActive: sourceIds => addButtonToElement({
                    innerText: '\u2716',
                    title: 'Set active!',
                    onclick: wrapFunction(() => {
                        return this.api.updateVideoSourcesState({
                            videoId,
                            sourceIds,
                            isActive: true,
                        });
                    }),
                }),
                setInactive: sourceIds => addButtonToElement({
                    innerText: '\u2713',
                    title: 'Set inactive!',
                    onclick: wrapFunction(() => {
                        return this.api.deactivateVideo(videoId, sourceIds);
                    }),
                }),
                setDisableDeprecated: sourceIds => addButtonToElement({
                    innerText: '\u2716',
                    title: 'Remove deprecated inactive!',
                    onclick: wrapFunction(() => {
                        return this.api.updateVideoSourcesState({
                            videoId,
                            sourceIds,
                            isActiveDeprecated: false,
                        });
                    }),
                }),
            };

            const activeSources = videoUserState.sources.filter(vus => vus.isActive);
            const isSingleActive = activeSources.length === 1;
            const inactiveSources = videoUserState.sources.filter(vus => !vus.isActive);
            const isSingleInactive = inactiveSources.length === 1;
            const inactiveDeprecatedSources = videoUserState.sources.filter(vus => !vus.isActive && vus.isActiveDeprecated);
            const isSingleDeprecatedInactive = inactiveDeprecatedSources.length === 1;

            element.innerHTML = '';
            if (videoUserState.isWatched) {
                buttonOptions.setNotWatched();
                if (isSingleActive) buttonOptions.setInactive(activeSources.map(s => s.sourceId));
                if (isSingleInactive) buttonOptions.setActive(inactiveSources.map(s => s.sourceId));

                className = classNames.watched;
            } else if (isSingleDeprecatedInactive && videoUserState.sources.length === 1) {
                buttonOptions.setWatched();
                buttonOptions.setDisableDeprecated(inactiveDeprecatedSources.map(s => s.sourceId));

                className = classNames.inactiveDepricated;
            } else if (isSingleInactive && videoUserState.sources.length === 1) {
                buttonOptions.setWatched();
                buttonOptions.setActive(inactiveSources.map(s => s.sourceId));

                className = classNames.inactive;
            } else if (videoUserState.sources.length === 1) {
                buttonOptions.setWatchedAndInactive(videoUserState.sources.map(s => s.sourceId));
                if (isSingleActive) buttonOptions.setInactive(activeSources.map(s => s.sourceId));
                if (isSingleInactive) buttonOptions.setActive(inactiveSources.map(s => s.sourceId));

                className = classNames.active;
            } else if (activeSources.length === 1) {
                buttonOptions.setWatchedAndInactive();
                buttonOptions.setInactive(activeSources.map(s => s.sourceId));
                addButtonToElement({
                    innerText: `${inactiveSources.length} / ${videoUserState.sources.length}`,
                    className: 'yt-video-user-state-action-button-count',
                });

                className = classNames.active;
            } else {
                buttonOptions.setWatched();
                addButtonToElement({
                    innerText: `${inactiveSources.length} / ${videoUserState.sources.length}`,
                    className: 'yt-video-user-state-action-button-count',
                });

                className = classNames.count;
            }
        }

        if (innerText) element.innerText = innerText;
        element.classList.remove(...Object.values(classNames));
        element.classList.add(className);
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