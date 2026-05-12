import { parseDuration, parseFormattedInt } from './utils';
import { extractViews } from './utils/extractViews';

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
        comments: Array.isArray(commentSection?.header) && parseFormattedInt(commentSection?.header?.map(h => h?.commentsHeaderRenderer).find(Boolean)?.countText?.runs?.
            map(r => parseInt(r?.text, 10)).find(t => !Number.isNaN(t))) || undefined,
    };
}

export function fromWatchVideoDetails(raw) {
    if (!raw) {
        return null;
    }
    return {
        id: raw.videoId,
        title: raw.title,
        channelTitle: raw.author,
        channelId: raw.channelId,
        views: raw.viewCount,
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

export function fromReelItemRenderer({ reelItemRenderer: raw }, additionalData) {
    const { channelTitle, channelId } = additionalData || {};
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.headline?.simpleText,
        channelTitle: channelTitle || raw?.navigationEndpoint?.reelWatchEndpoint?.overlay?.reelPlayerOverlayRenderer
            ?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.channelTitleText?.runs
            ?.map(r => r?.text).filter(Boolean).join(''),
        channelId: channelId || raw?.navigationEndpoint?.reelWatchEndpoint?.overlay?.reelPlayerOverlayRenderer
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
            reelTitleText?.runs?.map(r => r.text).filter(Boolean).join('')
            || raw.metapanel?.reelMetapanelViewModel?.metadataItems?.
                map(r => r?.shortsVideoTitleViewModel?.text?.content).find(Boolean),
        channelTitle: raw.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.
            channelTitleText?.runs?.map(r => r.text).find(Boolean),
        channelId: raw.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.
            channelNavigationEndpoint?.browseEndpoint?.browseId
            || raw.metapanel?.reelMetapanelViewModel?.metadataItems?.
                map(r => r?.reelChannelBarViewModel?.subscribeButtonViewModel?.subscribeButtonViewModel?.channelId).find(Boolean),
        likes: raw?.likeButton?.likeButtonRenderer?.likeCount,
    };
}

export function fromShortsLockupViewModel({ shortsLockupViewModel: raw }, additionalData) {
    const { channelTitle, channelId } = additionalData || {};
    const videoId = raw?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
    return videoId && {
        id: videoId,
        title: raw.overlayMetadata?.primaryText?.content,
        channelTitle,
        channelId,
        views: parseFormattedInt(raw.overlayMetadata?.secondaryText?.content),
    };
}

export function fromPlaylistVideoRenderer({ playlistVideoRenderer: raw }) {
    return raw && raw.videoId && {
        id: raw.videoId,
        title: raw.title?.runs?.map(r => r?.text).filter(Boolean).join(''),
        channelTitle: raw.shortBylineText?.runs?.map(r => r.text).find(Boolean),
        channelId: raw.shortBylineText?.runs?.map(r => r.navigationEndpoint?.browseEndpoint?.browseId).find(Boolean),
        duration: parseInt(raw.lengthSeconds),
    };
}

export function fromLockupViewModel({ lockupViewModel: raw }, additionalData) {
    if (!raw) {
        return null;
    }

    let channelTitle;
    let channelId;
    const channel = raw.metadata?.lockupMetadataViewModel?.image?.avatarStackViewModel?.rendererContext?.commandContext?.onTap?.
        innertubeCommand?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.
        listItems?.map(i => i.listItemViewModel).find(Boolean);
    if (channel) {
        // collabaration between channels. First one is the main channel
        channelTitle = channel.title?.content;
        channelId = channel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint?.browseId;
    } else if (additionalData && additionalData.channelTitle && additionalData.channelId) {
        channelTitle = additionalData.channelTitle;
        channelId = additionalData.channelId;
    } else {
        channelTitle = raw.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.at(0)?.metadataParts?.at(0)?.text?.content;
        channelId = raw.metadata?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint?.browseId;
    }

    if (!channelId) {
        console.log('handle from lockup5:', {
            channelId,
            channelTitle,
            title: raw.metadata?.lockupMetadataViewModel?.title?.content,
            channel,
            raw,
            additionalData
        })
    }
    return raw && {
        id: raw.contentId,
        title: raw.metadata?.lockupMetadataViewModel?.title?.content,
        channelTitle,
        channelId,
        duration: parseDuration(raw.contentImage?.thumbnailViewModel?.overlays?.map(o => o?.thumbnailOverlayBadgeViewModel?.thumbnailBadges)?.find(Boolean)?.map(t => t?.thumbnailBadgeViewModel?.text)?.find(Boolean)),
    };
}

export function fromPlayerMicroformatRenderer({ playerMicroformatRenderer: raw }) {
    return raw && {
        id: raw.externalVideoId,
        title: raw.title?.simpleText,
        channelTitle: raw.ownerChannelName,
        channelId: raw.externalChannelId,
        duration: Number.parseInt(raw.lengthSeconds) || null,
        views: Number.parseInt(raw.viewCount) || null,
        likes: Number.parseInt(raw.likeCount) || null,
        localizedDescription: raw.description?.simpleText,
        publishedAt: raw.publishDate,
    }
}
