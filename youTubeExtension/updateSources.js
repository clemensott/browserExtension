importIntoWebsite(async function ({ createAPI, groupBy, tryIgnore, triggerEvent }) {
    const api = await createAPI();

    if (!api) {
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

    function getWatchPlaylistVideoData({ playlistPanelVideoRenderer: raw }) {
        try {
            return raw?.videoId && {
                id: raw?.videoId,
                title: raw?.title?.simpleText,
                channelTitle: raw?.longBylineText?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelId: raw?.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
                duration: parseDuration(raw?.lengthText?.simpleText),
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

    function getSearchPrimaryExtendedVideo(raw) {
        return tryIgnore(() => raw?.shelfRenderer?.content?.verticalListRenderer?.items) || raw;
    }

    function getSearchPrimaryVideoData({ videoRenderer: raw }) {
        try {
            return raw?.videoId && {
                id: raw.videoId,
                title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelTitle: raw.longBylineText?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelId: raw.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
                duration: parseDuration(raw?.lengthText?.simpleText),
                views: parseViews(raw.viewCountText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    function getSearchSecondaryVideoData({ watchCardCompactVideoRenderer: raw }) {
        try {
            const videoId = raw?.navigationEndpoint?.watchEndpoint?.videoId;
            return videoId && {
                id: videoId,
                title: raw.title?.simpleText,
                channelTitle: raw.byline?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelId: raw.byline?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
                duration: parseDuration(raw?.lengthText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    function getHomeExtendedVideo(raw) {
        return tryIgnore(() => raw?.richSectionRenderer?.content?.richShelfRenderer?.contents) || raw;
    }

    function getHomeVideoData({ richItemRenderer: raw }) {
        try {
            const video = raw?.content?.videoRenderer;
            return video?.videoId && {
                id: video?.videoId,
                title: video.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelTitle: video?.longBylineText?.runs?.map(r => r?.text).filter(Boolean).join(''),
                channelId: video?.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
                duration: parseDuration(video?.lengthText?.simpleText),
                views: parseViews(video.viewCountText?.simpleText),
            };
        } catch {
            return null;
        }
    }

    async function handleVideosUpdates(videos, fetchTime) {
        if (videos && videos.length) {
            console.log('handleVideosUpdates1:', videos, fetchTime);
            await triggerEvent('startHandleVideos', videos);
            const channels = groupBy(videos, video => video.channelId);

            await api.createChannels(Array.from(channels.keys()));
            await api.updateChannels(channels, fetchTime);
            await api.updateThumbnails(videos.map(v => v.id));
            await api.updateUserStateOfVideos(videos.map(video => video.id), true);
            await triggerEvent('endHandleVideos', videos);
        }
    }

    window.handleData = async function (data) {
        console.log('handleData');
        const fetchTime = new Date().toISOString();
        window.lastHandleData = data;

        const watchVideo = tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.results?.results?.contents);
        const watchVideoId = tryIgnore(() => data?.currentVideoEndpoint?.watchEndpoint?.videoId);
        if (watchVideo && watchVideoId) {
            const videos = [getWatchVideoData(watchVideo, watchVideoId)].filter(Boolean);
            console.log('handle watch video:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const watchPlaylistVideos = tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents);
        if (watchPlaylistVideos) {
            const videos = watchPlaylistVideos.map(getWatchPlaylistVideoData).filter(Boolean);
            console.log('handle watch playlist videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const recommendationVideos =
            tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results) ||
            tryIgnore(() => data?.onResponseReceivedEndpoints[0]?.appendContinuationItemsAction?.continuationItems);
        if (recommendationVideos) {
            const videos = recommendationVideos.map(getRecommendationVideosData).filter(Boolean);
            console.log('handle recommendation videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const channelVideos =
            tryIgnore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t.tabRenderer).filter(Boolean).find(r => r.title === 'Videos')?.content?.sectionListRenderer?.contents?.
                map(c1 => c1.itemSectionRenderer?.contents?.map(c2 => c2?.gridRenderer?.items).find(Boolean)).find(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).find(Boolean));
        const channelTitle =
            tryIgnore(() => data?.header?.c4TabbedHeaderRenderer?.title) ||
            tryIgnore(() => data?.metadata?.channelMetadataRenderer?.title);
        const channelId =
            tryIgnore(() => data?.header?.c4TabbedHeaderRenderer?.channelId) ||
            tryIgnore(() => data?.metadata?.channelMetadataRenderer?.externalId);
        if (channelVideos && channelTitle && channelId) {
            const videos = channelVideos.map(v => getChannelVideosData(v, channelTitle, channelId)).filter(Boolean);
            console.log('handle channel videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const subBoxSections =
            tryIgnore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t.tabRenderer).find(t => t?.tabIdentifier === 'FEsubscriptions')?.
                content?.sectionListRenderer?.contents?.filter(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).filter(Boolean).flat());
        if (subBoxSections) {
            const subBoxVideos = subBoxSections
                .map(s => s?.itemSectionRenderer?.contents.map(c => c?.shelfRenderer.content.gridRenderer.items).filter(Boolean).flat())
                .filter(Boolean).flat();
            const videos = subBoxVideos.map(getSubBoxVideoData).filter(Boolean);
            console.log('handle sub box videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const searchPrimaryVideos =
            tryIgnore(() => data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.
                contents?.map(c => c?.itemSectionRenderer?.contents).flat().filter(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedCommands?.map(r => r?.appendContinuationItemsAction?.continuationItems?.
                map(i => i?.itemSectionRenderer?.contents).flat()).flat().filter(Boolean));
        if (searchPrimaryVideos) {
            const videos = searchPrimaryVideos.map(getSearchPrimaryExtendedVideo).flat()
                .map(getSearchPrimaryVideoData).filter(Boolean);
            console.log('handle primary search videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const searchSecondaryVideos = tryIgnore(() => data?.contents?.twoColumnSearchResultsRenderer?.
            secondaryContents?.secondarySearchContainerRenderer?.contents?.map(c => c?.universalWatchCardRenderer?.sections?.
                map(s => s?.watchCardSectionSequenceRenderer?.lists?.
                    map(l => l?.verticalWatchCardListRenderer?.items).filter(Boolean).flat()).
                filter(Boolean).flat()).filter(Boolean).flat());
        if (searchSecondaryVideos) {
            const videos = searchSecondaryVideos.map(getSearchSecondaryVideoData).filter(Boolean);
            console.log('handle secondary search videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }

        const homeVideos =
            tryIgnore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t?.tabRenderer.content.richGridRenderer.contents).flat().filter(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedActions?.
                map(r => r?.appendContinuationItemsAction?.continuationItems).flat().filter(Boolean));
        if (homeVideos) {
            const videos = homeVideos.map(getHomeExtendedVideo).flat().map(getHomeVideoData).filter(Boolean);
            console.log('handle home videos:', videos.length);
            await handleVideosUpdates(videos, fetchTime);
        }
    }

    async function handleFetchPromise(promise) {
        const response = await promise;

        if (response.ok && [
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/search',
        ].some(url => response.url.startsWith(url))) {
            const textPromise = response.text();
            response.text = () => textPromise;
            try {
                const text = await textPromise;
                await window.handleData(JSON.parse(text));
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

    try {
        await window.handleData(ytInitialData);
    } catch (e) {
        console.error(e)
    }
});