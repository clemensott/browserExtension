const subBoxJsCode = (async function mainSubBoxFun() {
    const videoUserStateClassName = 'yt-video-user-state-container';

    function groupBy(array, keySelector) {
        const map = new Map();
        array.forEach(obj => {
            const key = keySelector(obj);
            if (map.has(key)) {
                map.get(key).push(obj);
            } else {
                map.set(key, [obj]);
            }
        })
        return map;
    }

    function tryIgonore(func) {
        try {
            return func();
        } catch {
            return null;
        }
    }

    class API {
        constructor(username, password, baseUrl, videoUserStateUpdateInterval) {
            this.username = username;
            this.password = password;
            this.baseUrl = baseUrl;
            this.videoUserStateUpdateInterval = videoUserStateUpdateInterval || 60;
            this.sources = new Map();
            this.videoUserStates = {};
        }

        getUpdate(value, overrideHasUpdate) {
            const hasUpdate = !!overrideHasUpdate || !!value;
            return hasUpdate ? {
                value,
                hasUpdate: true,
            } : undefined;
        }

        async init() {
            try {
                if (!this.username || !this.password || !this.baseUrl) {
                    return false
                }

                const response = await this.call({
                    url: '/api/ping',
                    method: 'GET'
                });
                return response.ok;
            } catch (e) {
                return false;
            }
        }

        call({ url, method = 'POST', body }) {
            return window.fetch(this.baseUrl + url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify({
                    username: this.username,
                    password: this.password,
                    ...body,
                }) : undefined,
            });
        }

        isVideoToUpdateUserState(videoId) {
            const userState = this.videoUserStates[videoId];
            return !userState?.timestamp || (Date.now() - userState.timestamp > this.videoUserStateUpdateInterval * 1000);
        }

        async updateUserStateOfVideos(videoIds, forceUpdate = false) {
            if (!forceUpdate) {
                videoIds = videoIds.filter(videoId => this.isVideoToUpdateUserState(videoId));
            }
            if (videoIds.length == 0) {
                return;
            }

            const response = await this.call({
                url: '/api/videos/userState',
                body: {
                    videoIds,
                }
            });

            let array = [];
            if (response.ok) {
                array = JSON.parse(await response.text());
            }

            videoIds.forEach(videoId => {
                this.videoUserStates[videoId] = {
                    videoId,
                    timestamp: Date.now(),
                    ...array.find(item => item.videoId === videoId),
                };
            });
            return videoIds;
        }

        async createChannels(channelIds) {
            try {
                let missingChannelIds = channelIds.filter(id => !this.sources.has(id));
                if (!missingChannelIds.length) {
                    return;
                }

                const fetchChannelsResponse = await this.call({
                    url: '/api/sources/fromYoutubeIds',
                    body: {
                        youTubeIds: missingChannelIds,
                    },
                });
                if (!fetchChannelsResponse.ok) {
                    return;
                }

                const fetchedChannels = JSON.parse(await fetchChannelsResponse.text());
                fetchedChannels.forEach(channel => this.sources.set(channel.youTubeId, channel));

                missingChannelIds = channelIds.filter(id => !this.sources.has(id));
                if (missingChannelIds.length) {
                    await missingChannelIds.reduce(async (promise, channelId) => {
                        await promise;
                        const response = await this.call({
                            url: '/api/sources/add',
                            body: {
                                youTubeId: channelId,
                                isActive: false,
                            }
                        });

                        if (response.ok) {
                            const source = JSON.parse(await response.text());
                            if (source?.youTubeId) {
                                this.sources.set(source.youTubeId, source);
                            }
                        }
                    }, Promise.resolve());
                }
            } catch (e) {
                console.error('createChannel error', e);
            }
        }

        async updateChannels(channels, fetchTime) {
            try {
                if (!fetchTime) {
                    fetchTime = new Date().toISOString();
                }
                const sources = Array.from(channels.keys()).map(channelId => {
                    const sourceId = this.sources.get(channelId)?.id;
                    const videos = Array.from(groupBy(channels.get(channelId), v => v.id).values()).map(g => g[0]).filter(Boolean);
                    const channelTitle = videos.map(v => v.channelTitle).find(Boolean);
                    return sourceId && {
                        id: sourceId,
                        title: this.getUpdate(channelTitle),
                        type: 3,
                        videos: videos.map(video => ({
                            id: video.id,
                            localizedTitle: this.getUpdate(video.title),
                            channelTitle: this.getUpdate(video.channelTitle),
                            channelId: this.getUpdate(video.channelId),
                            durationTicks: this.getUpdate(video.duration * 1000 * 1000 * 10),
                            state: this.getUpdate(0, true),
                            fetchTime,
                        })),
                        fetchTime,
                    }
                }).filter(Boolean);
                if (sources.length) {
                    await this.call({
                        url: '/api/sources/update',
                        method: 'PUT',
                        body: {
                            sources,
                        },
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }

        updateUserVideo(videoId, isWatched) {
            return this.call({
                url: `/api/videos/userState/${videoId}`,
                method: 'PUT',
                body: {
                    isWatched,
                },
            });
        }

        updateVideoSourcesState({ videoId, sourceIds, isActive, isActiveDeprecated }) {
            return sourceIds && sourceIds.length ? this.call({
                url: `/api/videos/sourcesState/${videoId}`,
                method: 'PUT',
                body: {
                    sourceIds,
                    isActive,
                    isActiveDeprecated,
                },
            }) : Promise.resolve();
        }

        deactivateVideo(videoId, sourceIds) {
            return sourceIds && sourceIds.length ? this.call({
                url: `/api/videos/${videoId}`,
                method: 'DELETE',
                body: {
                    sourceIds,
                },
            }) : Promise.resolve();
        }
    }

    class Mutex {
        constructor(func) {
            this.func = func;
            this.promise = null;
        }

        async runInternal(lastPromise, params) {
            try {
                await lastPromise;
            } catch { }
            return this.func(...(params || []));
        }

        async run({
            optional = false,
            params,
        } = {}) {
            if (optional && this.promise) {
                return;
            }

            let promise = null;
            try {
                return await (this.promise = promise = this.runInternal(this.promise, params));
            } finally {
                if (this.promise === promise) {
                    this.promise = null;
                }
            }
        }
    }

    const api = new API(
        localStorage.getItem('subscriptionBoxUsername'),
        localStorage.getItem('subscriptionBoxPassword'),
        localStorage.getItem('subscriptionBoxBaseUrl'),
        Number(localStorage.getItem('subscriptionBoxVideoUserStateUpdateInterval')),
    );

    if (!await api.init()) {
        console.warn('API init error. You may need to update credentials:\n' +
            'localStorage.setItem("subscriptionBoxUsername", "");\n' +
            'localStorage.setItem("subscriptionBoxPassword", "");\n' +
            'localStorage.setItem("subscriptionBoxBaseUrl", "");');
        return;
    }

    function parseDuration(rawDuration) {
        if (!rawDuration) {
            return null;
        }
        const parts = rawDuration.split(':');
        while (parts.length < 3) {
            parts.unshift('0');
        }
        const [hours, minutes, seconds] = parts;
        if (!hours || !minutes || !seconds) {
            return null;
        }
        return ((parseInt(hours, 10) * 60 + parseInt(minutes, 10)) * 60 + parseInt(seconds));
    }

    function parseViews(rawViews) {
        return rawViews?.trim().split(' ')[0].replaceAll('.', '').replaceAll(',', '');
    }

    function getRecommendationVideosData({ compactVideoRenderer: raw }) {
        try {
            return raw?.videoId && {
                id: raw.videoId,
                title: raw.title?.simpleText,
                channelTitle: raw.longBylineText?.runs?.map(r => r?.text)?.find(Boolean),
                channelId: raw.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId)?.find(Boolean),
                duration: parseDuration(raw.lengthText?.simpleText),
                views: parseViews(raw.viewCountText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    function getChannelVideosData({ gridVideoRenderer: raw }, channelTitle, channelId) {
        try {
            return raw?.videoId && {
                id: raw.videoId,
                title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelTitle,
                channelId,
                duration: parseDuration(raw.thumbnailOverlays?.map(o => o?.thumbnailOverlayTimeStatusRenderer?.text.simpleText).find(Boolean)),
                views: parseViews(raw.viewCountText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    function getWatchVideoData(raw, videoId) {
        try {
            const videoSection = raw.map(c => c?.videoPrimaryInfoRenderer).find(Boolean);
            const channelSection = raw.map(c => c?.videoSecondaryInfoRenderer).find(Boolean);
            const commentSection = raw.map(c => c?.itemSectionRenderer).find(Boolean);
            return videoSection && channelSection && {
                id: videoId,
                title: videoSection?.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelTitle: channelSection?.owner?.videoOwnerRenderer?.title?.runs?.map(r => r?.text).find(Boolean),
                channelId: channelSection?.owner?.videoOwnerRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
                views: parseViews(videoSection?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText),
                likes: videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                    map(b => b.toggleButtonRenderer).find(b => b.defaultIcon.iconType === 'LIKE')?.defaultText.simpleText,
                dislikes: videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                    map(b => b.toggleButtonRenderer).find(b => b.defaultIcon.iconType === 'DISLIKE')?.defaultText.simpleText,
                comments: commentSection?.header?.map(h => h?.commentsHeaderRenderer).find(Boolean)?.countText?.runs?.
                    map(r => parseInt(r?.text, 10)).find(t => !Number.isNaN(t)),
            };
        } catch {
            return null;
        }
    }

    function getSubBoxVideoData({ gridVideoRenderer: raw }) {
        try {
            return raw?.videoId && {
                id: raw.videoId,
                title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelTitle: raw.shortBylineText?.runs?.map(r => r?.text).find(Boolean),
                channelId: raw.shortBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
                duration: parseDuration(raw.thumbnailOverlays?.map(o => o?.thumbnailOverlayTimeStatusRenderer?.text.simpleText).find(Boolean)),
                views: parseViews(raw.viewCountText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    async function handleVideosUpdates(videos, fetchTime) {
        console.log('handleVideosUpdates1:', videos, fetchTime);
        await loop.run();
        const channels = groupBy(videos, video => video.channelId);

        await api.createChannels(Array.from(channels.keys()));
        await api.updateChannels(channels, fetchTime);
        await api.updateUserStateOfVideos(videos.map(video => video.id), true);
        await loop.run();
    }

    window.handleData = async function (data) {
        console.log('handleData');
        const fetchTime = new Date().toISOString();
       
        const watchVideo = tryIgonore(() => data?.contents?.twoColumnWatchNextResults?.results?.results?.contents);
        const watchVideoId = tryIgonore(() => data?.currentVideoEndpoint?.watchEndpoint?.videoId);
        if (watchVideo && watchVideoId) {
            const videos = [getWatchVideoData(watchVideo, watchVideoId)].filter(Boolean);
            await handleVideosUpdates(videos, fetchTime);
        }

        const recommendationVideos =
            tryIgonore(() => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results) ||
            tryIgonore(() => data?.onResponseReceivedEndpoints[0]?.appendContinuationItemsAction?.continuationItems);
        if (recommendationVideos) {
            const videos = recommendationVideos.map(getRecommendationVideosData).filter(Boolean);
            await handleVideosUpdates(videos, fetchTime);
        }

        const channelVideos =
            tryIgonore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t.tabRenderer).filter(Boolean).find(r => r.title === 'Videos')?.content?.sectionListRenderer?.contents?.
                map(c1 => c1.itemSectionRenderer?.contents?.map(c2 => c2?.gridRenderer?.items).find(Boolean)).find(Boolean)) ||
            tryIgonore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).find(Boolean));
        const channelTitle =
            tryIgonore(() => data?.header?.c4TabbedHeaderRenderer?.title) ||
            tryIgonore(() => data?.metadata?.channelMetadataRenderer?.title);
        const channelId =
            tryIgonore(() => data?.header?.c4TabbedHeaderRenderer?.channelId) ||
            tryIgonore(() => data?.metadata?.channelMetadataRenderer?.externalId);
        if (channelVideos && channelTitle && channelId) {
            const videos = channelVideos.map(v => getChannelVideosData(v, channelTitle, channelId)).filter(Boolean)
            await handleVideosUpdates(videos, fetchTime);
        }

        const subBoxSections =
            tryIgonore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t.tabRenderer).find(t => t?.tabIdentifier === 'FEsubscriptions')?.
                content?.sectionListRenderer?.contents?.filter(Boolean)) ||
            tryIgonore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).filter(Boolean).flat());

        if (subBoxSections) {
            const subBoxVideos = subBoxSections
                .map(s => s?.itemSectionRenderer?.contents.map(c => c?.shelfRenderer.content.gridRenderer.items).filter(Boolean).flat())
                .filter(Boolean).flat();
            const videos = subBoxVideos.map(getSubBoxVideoData).filter(Boolean);
            await handleVideosUpdates(videos, fetchTime);
        }
    }

    async function handleFetchPromise(promise) {
        const response = await promise;

        if (response.ok && [
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player'
        ].some(url => response.url.startsWith(url))) {
            const textPromise = response.text();
            response.text = () => textPromise;
            try {
                const text = await textPromise;
                window.handleData(JSON.parse(text));
            } catch (e) {
                console.error(e)
            }
        }
    }

    const oldFetch = fetch;
    fetch = function (...params) {
        // console.log('fetch:', ...params);
        const promise = oldFetch(...params);
        handleFetchPromise(promise);
        return promise;
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
            if (insertReferenceNodeSelector) console.log('ref node:', insertReferenceNodeSelector, refNode);
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
            } else if (activeSources.length === 1){
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

    window.handleData(ytInitialData);

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
}).toString();

(function () {
    const script = document.createElement('script');
    script.innerText = `eval(${JSON.stringify(subBoxJsCode)})`;
    document.body.appendChild(script);
    const linkTrigger = document.createElement('a');
    linkTrigger.href = 'javascript:mainSubBoxFun()';
    linkTrigger.click();
})();
