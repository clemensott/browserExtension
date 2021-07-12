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
        constructor(username, password, baseUrl) {
            this.username = username;
            this.password = password;
            this.baseUrl = baseUrl;
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
            return !userState?.timestamp || (Date.now() - userState.timestamp > 60 * 1000);
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
                    const videos = channels.get(channelId);
                    const channelTitle = videos.map(v => v.channelTitle).find(Boolean);
                    return sourceId && {
                        id: sourceId,
                        title: this.getUpdate(channelTitle),
                        type: 1,
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

        async runInternal(lastPromise) {
            try {
                await lastPromise;
            } catch { }

            return this.func();
        }

        async run(optional = false) {
            if (optional && this.promise) {
                return;
            }

            let promise = null;
            try {
                return await (this.promise = promise = this.runInternal(this.promise));
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
                title: raw.title?.runs?.map(r => r?.text).find(Boolean),
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
                title: videoSection?.title?.runs?.map(r => r?.text).find(Boolean),
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
                title: raw.title?.runs?.map(r => r?.text).find(Boolean),
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
            await handleVideosUpdates([getWatchVideoData(watchVideo, watchVideoId)], fetchTime);
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
        const textPromise = response.text();
        response.text = () => textPromise;

        if (response.ok && (
            response.url.startsWith('https://www.youtube.com/youtubei/v1/next') ||
            response.url.startsWith('https://www.youtube.com/youtubei/v1/browse') ||
            response.url.startsWith('https://www.youtube.com/youtubei/v1/player')
        )) {
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

    function updateVideoUserStateUI(container, videoId, additionalStyles) {
        if (!container) {
            return;
        }

        const videoUserState = api.videoUserStates[videoId];
        let element = container.querySelector(`.${videoUserStateClassName}`);
        if (!element) {
            element = document.createElement('span');
            element.classList.add(videoUserStateClassName);
            element.style['font-size'] = '13px';
            if (additionalStyles) {
                Object.keys(additionalStyles).forEach(key => element.style[key] = additionalStyles[key]);
            }
            container.appendChild(element);
        }

        if (!videoUserState?.items?.length) {
            element.innerText = '\u2370';
            element.style.cursor = null;
            return;
        } else {
            const inactiveCount = videoUserState && videoUserState.items.filter(vus => !vus.isActive).length;
            if (inactiveCount === videoUserState.items.length) {
                element.innerText = '\u2705';
            } else if (videoUserState.items.length === 1) {
                element.innerText = '\u274C';
            } else {
                element.innerText = `${inactiveCount} / ${videoUserState.items.length} `;
            }
        }

        const activeSourceIds = videoUserState?.items?.filter(vus => vus.isActive)?.map(vus => vus.sourceId);
        if (activeSourceIds?.length === 1) {
            element.style.cursor = 'pointer';
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
            element.style.cursor = 'default';
            element.title = '';
            element.onclick = null;
        }
    }

    const loop = new Mutex(async function () {
        try {
            const currentVideoUserStateContainer = getCurrentVideoUserStateContainer();
            const currentVideoId = getVideoIdFromUrl(window.location.href);
            const videoContainers = getVideoContainers();
            const videoIds = videoContainers.map(getVideoIdFromVideoContainer);
            if (currentVideoId) {
                videoIds.push(currentVideoId);
            }

            await api.updateUserStateOfVideos(videoIds);

            if (currentVideoUserStateContainer && currentVideoId) {
                updateVideoUserStateUI(currentVideoUserStateContainer, currentVideoId, {
                    'padding-left': '5px',
                });
            }

            videoContainers.forEach(container => {
                const videoId = getVideoIdFromVideoContainer(container);
                updateVideoUserStateUI(container, videoId, {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    padding: '1px 1px 2px 1px',
                    margin: '2px',
                    background: 'white',
                    'border-radius': '3px'
                });
            });
        } catch (e) {
            console.error('loop error', e)
        }
    });

    setInterval(() => loop.run(true), 5000);

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
