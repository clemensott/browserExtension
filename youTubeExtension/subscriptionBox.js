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
                    url: '/api/sources',
                });
                if (!response.ok) {
                    return false;
                }
                JSON.parse(await response.text()).forEach(({ id, youTubeId }) => {
                    if (youTubeId) {
                        this.sources.set(youTubeId, id);
                    }
                });
                return true;
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
                body: JSON.stringify({
                    username: this.username,
                    password: this.password,
                    ...body,
                }),
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

            const updates = groupBy(array, videoUserState => videoUserState.id);
            videoIds.forEach(videoId => {
                this.videoUserStates[videoId] = {
                    videoId,
                    timestamp: Date.now(),
                    items: updates.get(videoId),
                };
            });
            return videoIds;
        }

        async createChannel(channelId) {
            try {
                if (!this.sources.has(channelId)) {
                    const response = await this.call({
                        url: '/api/sources/add',
                        body: {
                            youTubeId: channelId,
                            isActive: false,
                        }
                    });

                    if (response.ok) {
                        const { id, youTubeId } = JSON.parse(await response.text());
                        if (youTubeId) {
                            this.sources.set(youTubeId, id);
                        }
                    }
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
                    const sourceId = this.sources.get(channelId);
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

        async deleteVideo(videoId, sourceIds) {
            return this.call({
                url: `/api/videos/${videoId}`,
                method: 'DELETE',
                body: {
                    sourceIds,
                },
            });
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
        await loop.run();
        const channels = groupBy(videos, video => video.channelId);

        await Array.from(channels.keys()).reduce(async (promise, channelId) => {
            await promise;
            return api.createChannel(channelId);
        }, Promise.resolve());

        await api.updateChannels(channels, fetchTime);
        await api.init();
        await api.updateUserStateOfVideos(videos.map(video => video.id), true);
        await loop.run();
    }

    window.handleData = async function (data) {
        const fetchTime = new Date().toISOString();
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

        const watchVideo = tryIgonore(() => data?.contents?.twoColumnWatchNextResults?.results?.results?.contents);
        const watchVideoId = tryIgonore(() => data?.currentVideoEndpoint?.watchEndpoint?.videoId);
        if (watchVideo && watchVideoId) {
            const videos = [getWatchVideoData(watchVideo, watchVideoId)].filter(Boolean);
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
        return document.querySelector('#info-text');
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

    function updateVideoUserStateUI(container, videoId, additionalClassName) {
        if (!container) {
            return;
        }

        const videoUserState = api.videoUserStates[videoId];
        let element = container.querySelector(`.${videoUserStateClassName}`);
        if (!element) {
            element = document.createElement('span');
            element.classList.add(videoUserStateClassName);
            element.classList.add(additionalClassName);
            container.appendChild(element);
        }

        const timestamp = videoUserState?.timestamp || 0;
        if (element.dataset.id === videoId && element.dataset.timestamp >= timestamp) {
            return;
        }
        element.dataset.id = videoId;
        element.dataset.timestamp = timestamp;

        if (!videoUserState?.items?.length) {
            element.innerText = '\u2370';
            element.classList.add('yt-video-user-state-unkown');
            element.classList.remove('yt-video-user-state-active', 'yt-video-user-state-inactive', 'yt-video-user-state-count');
        } else {
            const inactiveCount = videoUserState && videoUserState.items.filter(vus => !vus.isActive).length;
            if (inactiveCount === videoUserState.items.length) {
                element.innerText = '\u2705';
                element.classList.add('yt-video-user-state-inactive');
                element.classList.remove('yt-video-user-state-active', 'yt-video-user-state-unkown', 'yt-video-user-state-count');
            } else if (videoUserState.items.length === 1) {
                element.innerText = '\u274C';
                element.classList.add('yt-video-user-state-active');
                element.classList.remove('yt-video-user-state-unkown', 'yt-video-user-state-inactive', 'yt-video-user-state-count');
            } else {
                element.innerText = `${inactiveCount} / ${videoUserState.items.length} `;
                element.classList.add('yt-video-user-state-count');
                element.classList.remove('yt-video-user-state-active', 'yt-video-user-state-inactive', 'yt-video-user-state-unkown');
            }
        }

        const activeSourceIds = videoUserState?.items?.filter(vus => vus.isActive)?.map(vus => vus.sourceId);
        if (activeSourceIds?.length === 1) {
            element.classList.add('yt-video-user-state-deletable');
            element.title = 'Delete Video';
            element.onclick = async () => {
                try {
                    await api.deleteVideo(videoId, activeSourceIds);
                    await api.updateUserStateOfVideos([videoId], true);
                    await loop.run();
                } catch (e) {
                    console.error('delete video error', e);
                }
            };
        } else {
            element.classList.remove('yt-video-user-state-deletable');
            element.title = '';
            element.onclick = null;
        }
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
                    updateVideoUserStateUI(currentVideoUserStateContainer, currentVideoId, 'yt-video-user-state-watch');
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
}).toString();

(function () {
    const script = document.createElement('script');
    script.innerText = `eval(${JSON.stringify(subBoxJsCode)})`;
    document.body.appendChild(script);
    const linkTrigger = document.createElement('a');
    linkTrigger.href = 'javascript:mainSubBoxFun()';
    linkTrigger.click();
})();
