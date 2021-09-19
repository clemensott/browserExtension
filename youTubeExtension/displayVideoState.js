importIntoWebsite(async function () {
    const { Mutex, createAPI } = window.subscriptionBox;
    const videoUserStateClassName = 'yt-video-user-state-container';
    const api = await createAPI();

    if (!api) {
        return;
    }

    function getCurrentVideoUserStateContainer() {
        return document.querySelector('ytd-video-primary-info-renderer #info');
    }

    function getVideoContainers() {
        return [
            ...document.querySelectorAll('#items > ytd-compact-video-renderer'),
            ...document.querySelectorAll('#items > ytd-grid-video-renderer')
        ];
    }

    function getVideoIdFromUrl(url) {
        const { searchParams } = new URL(url);
        return searchParams.get('v');
    }

    function getVideoIdFromVideoContainer(container) {
        const a = container.querySelector('a#thumbnail');
        return getVideoIdFromUrl(a.href);
    }

    function updateVideoUserStateUI(container, videoId, additionalClassName, insertReferenceNodeSelector = null) {
        if (!container) {
            return;
        }

        const videoUserState = api.videoUserStates[videoId];
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
            watched: 'yt-video-user-state-watched',
            active: 'yt-video-user-state-active',
            inactive: 'yt-video-user-state-inactive',
            inactiveDepricated: 'yt-video-user-state-inactive-depricated',
            count: 'yt-video-user-state-count',
        }
        let className = '';
        let innerText = '';

        if (!videoUserState?.sources?.length) {
            innerText = '\u2370';
            className = classNames.unkown;
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
                        await api.updateUserStateOfVideos([videoId], true);
                        await loop.run();
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
                            api.updateUserVideo(videoId, true),
                            api.deactivateVideo(videoId, sourceIds),
                        ]);
                    }),
                }),
                setWatched: () => addButtonToElement({
                    innerText: '\u2713',
                    title: 'Set watched!',
                    onclick: wrapFunction(() => {
                        return api.updateUserVideo(videoId, true);
                    }),
                }),
                setNotWatched: () => addButtonToElement({
                    innerText: '\u274C',
                    title: 'Set not watched!',
                    onclick: wrapFunction(() => {
                        return api.updateUserVideo(videoId, false);
                    }),
                }),
                setActive: sourceIds => addButtonToElement({
                    innerText: '\u2716',
                    title: 'Set active!',
                    onclick: wrapFunction(() => {
                        return api.updateVideoSourcesState({
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
                        return api.deactivateVideo(videoId, sourceIds);
                    }),
                }),
                setDisableDeprecated: sourceIds => addButtonToElement({
                    innerText: '\u2716',
                    title: 'Remove deprecated inactive!',
                    onclick: wrapFunction(() => {
                        return api.updateVideoSourcesState({
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
                buttonOptions.setDisableDeprecated(inactiveDeprecatedSources.map(s => s.sourceId));

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

    const loop = new Mutex(async function (forceUserStateUpdate = false) {
        try {
            const currentVideoUserStateContainer = getCurrentVideoUserStateContainer();
            const currentVideoId = getVideoIdFromUrl(window.location.href);
            const videoContainers = getVideoContainers();
            updateUI();

            const videoIds = videoContainers.map(getVideoIdFromVideoContainer);
            if (currentVideoId) {
                videoIds.push(currentVideoId);
            }

            const updatedVideoIds = await api.updateUserStateOfVideos(videoIds, forceUserStateUpdate);
            updateUI(updatedVideoIds);

            function updateUI(videoIdsToUpdate) {
                function updateVideoId(videoId) {
                    return (!videoIdsToUpdate?.length || videoIdsToUpdate.includes(videoId));
                }

                if (currentVideoUserStateContainer && currentVideoId && updateVideoId(currentVideoId)) {
                    updateVideoUserStateUI(currentVideoUserStateContainer, currentVideoId, 'yt-video-user-state-watch', '#flex');
                }

                videoContainers.forEach(container => {
                    const videoId = getVideoIdFromVideoContainer(container);
                    if (updateVideoId(currentVideoId)) {
                        updateVideoUserStateUI(container, videoId, 'yt-video-user-state-list-item');
                    }
                });
            }
        } catch (e) {
            console.error('loop error', e)
        }
    });

    setInterval(() => loop.run({ optional: true }), 5000);

    window.onfocus = async () => {
        await loop.run({ params: [true] });
    };

    const initIntervalId = setInterval(() => {
        if (getVideoContainers().length) {
            loop.run();
            clearInterval(initIntervalId);
        }
    }, 100);

    function addDisableUi() {
        const dot = document.querySelector('#dot');
        if (dot) {
            const disableStyle = `.${videoUserStateClassName} { display:none }`;
            const disableStyleElement = document.createElement('style');
            document.body.appendChild(disableStyleElement);

            dot.onclick = () => {
                disableStyleElement.innerHTML = disableStyleElement.innerHTML ? '' : disableStyle;
            };
        }
    }
    setTimeout(addDisableUi, 1000);

    return {
        updateVideosState: function () {
            return loop.run();
        }
    }
});
