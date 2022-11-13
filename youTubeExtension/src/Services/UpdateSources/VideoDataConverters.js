import { parseDuration, parseFormattedInt } from './utils';

export function fromWatchVideo(raw, videoId) {
    if (!Array.isArray(raw)) {
        return null;
    }
    const videoSection = raw.map(c => c?.videoPrimaryInfoRenderer).find(Boolean);
    const channelSection = raw.map(c => c?.videoSecondaryInfoRenderer).find(Boolean);
    const commentSection = raw.map(c => c?.itemSectionRenderer).find(Boolean);
    return videoSection && channelSection && {
        id: videoId,
        title: videoSection?.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelTitle: channelSection?.owner?.videoOwnerRenderer?.title?.runs?.map(r => r?.text).find(Boolean),
        channelId: channelSection?.owner?.videoOwnerRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
        views: parseFormattedInt(videoSection?.viewCount?.videoViewCountRenderer?.viewCount?.simpleText),
        likes: parseFormattedInt(
            (
                videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                    map(b => b.toggleButtonRenderer)?.find(b => b?.defaultIcon?.iconType === 'LIKE')?.defaultText?.simpleText
            ) || (
                videoSection?.videoActions?.menuRenderer?.topLevelButtons?.
                    map(b => b?.segmentedLikeDislikeButtonRenderer?.likeButton?.toggleButtonRenderer?.defaultText?.simpleText).find(Boolean)
            )
        ),
        comments: parseFormattedInt(commentSection?.header?.map(h => h?.commentsHeaderRenderer).find(Boolean)?.countText?.runs?.
            map(r => parseInt(r?.text, 10)).find(t => !Number.isNaN(t))),
    };
}

export function fromVideoRenderer({ videoRenderer: raw }, additionalData) {
    const { channelTitle, channelId } = additionalData || {};
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelTitle: channelTitle || raw.longBylineText?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelId: channelId || raw.longBylineText?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseDuration(raw.lengthText?.simpleText),
        views: parseFormattedInt(raw.viewCountText?.simpleText),
    };
}

export function fromReelItemRenderer({ reelItemRenderer: raw }) {
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.headline?.simpleText,
        channelTitle: raw?.navigationEndpoint?.reelWatchEndpoint?.overlay?.reelPlayerOverlayRenderer
            ?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.channelTitleText?.runs
            ?.map(r => r?.text).filter(Boolean).join(''),
        channelId: raw?.navigationEndpoint?.reelWatchEndpoint?.overlay?.reelPlayerOverlayRenderer
            ?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer
            ?.channelNavigationEndpoint?.browseEndpoint?.browseId,
    };
}

export function fromCompactVideoRenderer({ compactVideoRenderer: raw }) {
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.simpleText,
        channelTitle: raw.longBylineText?.runs?.map(r => r?.text)?.find(Boolean),
        channelId: raw.longBylineText?.runs?.
            map(r => r?.navigationEndpoint?.browseEndpoint?.browseId)?.find(Boolean),
        duration: parseDuration(raw.lengthText?.simpleText),
        views: parseFormattedInt(raw.viewCountText?.simpleText),
    };
}

export function fromGridVideoRenderer({ gridVideoRenderer: raw }, additionalData) {
    const { channelTitle, channelId } = additionalData || {};
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelTitle: channelTitle || raw.shortBylineText?.runs?.map(r => r?.text).find(Boolean),
        channelId: channelId || raw.shortBylineText?.runs?.
            map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseDuration(raw.thumbnailOverlays?.map(
            o => o?.thumbnailOverlayTimeStatusRenderer?.text.simpleText).find(Boolean)
        ),
        views: parseFormattedInt(raw.viewCountText?.simpleText),
    };
}

export function fromWatchCardCompactVideoRenderer({ watchCardCompactVideoRenderer: raw }) {
    const videoId = raw?.navigationEndpoint?.watchEndpoint?.videoId;
    return videoId && {
        id: videoId,
        title: raw.title?.simpleText,
        channelTitle: raw.byline?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelId: raw.byline?.runs?.map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseDuration(raw?.lengthText?.simpleText),
    };
}

export function fromPlaylistPanelVideoRenderer({ playlistPanelVideoRenderer: raw }) {
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.simpleText,
        channelTitle: raw.longBylineText?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelId: raw.longBylineText?.runs?.
            map(r => r?.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseDuration(raw.lengthText?.simpleText),
    };
}

export function fromReelPlayerOverlayRenderer({ reelPlayerOverlayRenderer: raw }) {
    const videoId = raw?.likeButton?.likeButtonRenderer?.target?.videoId;
    return videoId && {
        id: videoId,
        title: raw.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.
            reelTitleText?.runs?.map(r => r.text).filter(Boolean).join(''),
        channelTitle: raw.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.
            channelTitleText?.runs?.map(r => r.text).find(Boolean),
        channelId: raw.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.
            channelNavigationEndpoint?.browseEndpoint?.browseId,
        likes: raw?.likeButton?.likeButtonRenderer?.likeCount,
    };
}

export function fromPlaylistVideoRenderer({ playlistVideoRenderer: raw }) {
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelTitle: raw.shortBylineText?.runs?.map(r=>r.text).find(Boolean),
        channelId: raw.shortBylineText?.runs?.map(r=>r.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseInt(raw.lengthSeconds),
    };
}
