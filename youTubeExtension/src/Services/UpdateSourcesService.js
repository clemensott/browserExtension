import groupBy from '../utils/groupBy';
import tryIgnore from '../utils/tryIgnore';
import triggerEvent from '../utils/triggerEvent';
import fetchIntersectorService from './FetchIntersectorService';

function fullFlat(array) {
    return array.map(a => Array.isArray(a) ? fullFlat(a) : a).flat();
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

function parseFormattedInt(raw) {
    const text = raw?.trim().split(' ')[0].replaceAll('.', '').replaceAll(',', '');
    return text ? parseInt(text, 10) : undefined;
}

function getRecommendationVideosData({ compactVideoRenderer: raw }) {
    try {
        return raw?.videoId && {
            id: raw.videoId,
            title: raw.title?.simpleText,
            channelTitle: raw.longBylineText?.runs?.map(r => r?.text)?.find(Boolean),
            channelId: raw.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId)?.find(Boolean),
            duration: parseDuration(raw.lengthText?.simpleText),
            views: parseFormattedInt(raw.viewCountText?.simpleText),
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
            views: parseFormattedInt(raw.viewCountText?.simpleText),
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
            views: parseFormattedInt(videoSection?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText),
            likes: parseFormattedInt(videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                map(b => b.toggleButtonRenderer).find(b => b.defaultIcon.iconType === 'LIKE')?.defaultText.simpleText),
            dislikes: parseFormattedInt(videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                map(b => b.toggleButtonRenderer).find(b => b.defaultIcon.iconType === 'DISLIKE')?.defaultText.simpleText),
            comments: parseFormattedInt(commentSection?.header?.map(h => h?.commentsHeaderRenderer).find(Boolean)?.countText?.runs?.
                map(r => parseInt(r?.text, 10)).find(t => !Number.isNaN(t))),
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
            views: parseFormattedInt(raw.viewCountText?.simpleText),
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
            views: parseFormattedInt(raw.viewCountText?.simpleText),
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
            views: parseFormattedInt(video.viewCountText?.simpleText),
        };
    } catch {
        return null;
    }
}


export default class UpdateSourcesService {
    constructor(api) {
        this.api = api;
        this.onFetchText = this.onFetchText.bind(this);
    }

    async handleVideosUpdates(videos, fetchTime) {
        if (videos && videos.length) {
            console.log('handleVideosUpdates1:', videos.length, fetchTime);

            try {
                triggerEvent('updateSources.startHandleVideos', videos);

                const channels = groupBy(videos, video => video.channelId);
                await this.api.createChannels(Array.from(channels.keys()));
                await this.api.updateChannels(channels, fetchTime);
            } finally {
                triggerEvent('updateSources.endHandleVideos', videos);
            }
        }
    }

    async handleThumbnailsUpdate(videoIds) {
        if (videoIds && videoIds.length) {
            triggerEvent('updateSources.startUpdateThumbnails', videoIds);
            const distinctVideoIds = Array.from(new Set(videoIds));
            await this.api.updateThumbnails(distinctVideoIds);
            triggerEvent('updateSources.endUpdateThumbnails', videoIds);
        }
    }

    async handleData(data) {
        const fetchTime = new Date().toISOString();
        const thumbnailUpdatePromises = [];

        const updateThumbnails = videos => {
            const visibleVideos = videos.filter(v => {
                const source = this.api.getSourceFromYouTubeId(v.channelId);
                return source && source.isActive && source.visibleVideos.includes(v.id);
            });
            thumbnailUpdatePromises.push(this.handleThumbnailsUpdate(visibleVideos.map(v => v.id)));
        }

        const watchVideo = tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.results?.results?.contents);
        const watchVideoId = tryIgnore(() => data?.currentVideoEndpoint?.watchEndpoint?.videoId);
        if (watchVideo && watchVideoId) {
            const videos = [getWatchVideoData(watchVideo, watchVideoId)].filter(Boolean);
            console.log('handle watch video:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        const recommendationVideos = fullFlat([
            tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results?.map(r => r?.itemSectionRenderer?.contents)),
            tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results),
            tryIgnore(() => data?.onResponseReceivedEndpoints[0]?.appendContinuationItemsAction?.continuationItems),
            tryIgnore(() => data?.onResponseReceivedEndpoints[0]?.reloadContinuationItemsCommand?.continuationItems),
        ]).filter(Boolean);
        if (recommendationVideos) {
            const videos = recommendationVideos.map(getRecommendationVideosData).filter(Boolean);
            console.log('handle recommendation videos:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        const watchPlaylistVideos = tryIgnore(() => data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents);
        if (watchPlaylistVideos) {
            const videos = watchPlaylistVideos.map(getWatchPlaylistVideoData).filter(Boolean);
            console.log('handle watch playlist videos:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
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
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        const subBoxSections =
            tryIgnore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t.tabRenderer).find(t => t?.tabIdentifier === 'FEsubscriptions')?.
                content?.sectionListRenderer?.contents?.filter(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).filter(Boolean).flat());
        if (subBoxSections) {
            const subBoxVideos = tryIgnore(() => subBoxSections.map(
                s => s?.itemSectionRenderer?.contents.map(c => c?.shelfRenderer?.content?.gridRenderer?.items).filter(Boolean).flat()
            ).filter(Boolean).flat());
            const videos = subBoxVideos.map(getSubBoxVideoData).filter(Boolean);
            console.log('handle sub box videos:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
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
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        const searchSecondaryVideos = tryIgnore(() => data?.contents?.twoColumnSearchResultsRenderer?.
            secondaryContents?.secondarySearchContainerRenderer?.contents?.map(c => c?.universalWatchCardRenderer?.sections?.
                map(s => s?.watchCardSectionSequenceRenderer?.lists?.
                    map(l => l?.verticalWatchCardListRenderer?.items).filter(Boolean).flat()).
                filter(Boolean).flat()).filter(Boolean).flat());
        if (searchSecondaryVideos) {
            const videos = searchSecondaryVideos.map(getSearchSecondaryVideoData).filter(Boolean);
            console.log('handle secondary search videos:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        const homeVideos =
            tryIgnore(() => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
                map(t => t?.tabRenderer.content.richGridRenderer.contents).flat().filter(Boolean)) ||
            tryIgnore(() => data?.onResponseReceivedActions?.
                map(r => r?.appendContinuationItemsAction?.continuationItems).flat().filter(Boolean));
        if (homeVideos) {
            const videos = homeVideos.map(getHomeExtendedVideo).flat().map(getHomeVideoData).filter(Boolean);
            console.log('handle home videos:', videos.length);
            await this.handleVideosUpdates(videos, fetchTime);
            updateThumbnails(videos);
        }

        await Promise.all(thumbnailUpdatePromises);
    }

    async onFetchText({ detail: { url, text, json } }) {
        if ([
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/search',
        ].some(u => url.startsWith(u))) {
            try {
                await this.handleData(json || JSON.parse(text));
            } catch (e) {
                console.error(e)
            }
        }
    }

    start() {
        fetchIntersectorService.addOnTextListener(this.onFetchText);
    }
}