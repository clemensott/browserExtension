import tryIgnore from '../../utils/tryIgnore';
import BaseDataHandler from './BaseDataHandler';

function tabFilter(tab) {
    return typeof tab?.title === 'string' && [
        'videos',
        'shorts',
        'live',
        'streams',
    ].includes(tab.title.toLowerCase());
}

const getVideosFuncs = [
    data => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
        map(t => t.tabRenderer).filter(Boolean).filter(tabFilter).
        flatMap(r => r?.content?.sectionListRenderer?.contents?.
            map(c1 => c1.itemSectionRenderer?.contents?.
                map(c2 => c2?.gridRenderer?.items).find(Boolean)
            )
        ),
    data => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
        map(t => t.tabRenderer).filter(Boolean).filter(tabFilter).
        flatMap(r => r?.content?.richGridRenderer?.contents?.
            map(c1 => c1.richItemRenderer?.content)
        ),
    data => data?.onResponseReceivedActions?.
        flatMap(a => a?.appendContinuationItemsAction?.continuationItems).
        filter(Boolean).
        map(i => i.richItemRenderer?.content),
    data => data?.onResponseReceivedActions?.
        flatMap(a => a?.appendContinuationItemsAction?.continuationItems),
];

const channels = new Map();
function getAdditionalData(data) {
    const channelId =
        tryIgnore(() => data?.header?.c4TabbedHeaderRenderer?.channelId) ||
        tryIgnore(() => data?.metadata?.channelMetadataRenderer?.externalId) ||
        tryIgnore(() => data?.responseContext?.serviceTrackingParams?.
            map(s => s.params).flat().find(p => p.key === 'browse_id')?.value);

    const channelTitle =
        tryIgnore(() => data?.header?.c4TabbedHeaderRenderer?.title) ||
        tryIgnore(() => data?.metadata?.channelMetadataRenderer?.title) ||
        channels.get(channelId);

    if (channelId && channelTitle) {
        channels.set(channelId, channelTitle);
    }
    return {
        channelId,
        channelTitle,
    };
}

const handler = new BaseDataHandler({
    name: 'channel videos',
    getVideosFuncs,
    getAdditionalData,
});

export default handler;
