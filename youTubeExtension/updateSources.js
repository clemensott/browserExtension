importIntoWebsite(async function () {
    const { createAPI, groupBy, tryIgonore } = window.subscriptionBox;
    const api = await createAPI();

    if (!api) {
        return;
    }

    function triggerUpdateVideosState() {
        const { updateVideosState } = window.subscriptionBox;
        return updateVideosState && updateVideosState();
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
        await triggerUpdateVideosState();
        const channels = groupBy(videos, video => video.channelId);

        await api.createChannels(Array.from(channels.keys()));
        await api.updateChannels(channels, fetchTime);
        await api.updateUserStateOfVideos(videos.map(video => video.id), true);
        await triggerUpdateVideosState();
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

    window.handleData(ytInitialData);
});