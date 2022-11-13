import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
        map(t => t.tabRenderer).
        find(t => t?.tabIdentifier === 'FEsubscriptions')?.
        content?.sectionListRenderer?.contents?.filter(Boolean),
    data => data?.onResponseReceivedActions?.
        map(a => a?.appendContinuationItemsAction?.continuationItems).filter(Boolean).flat(),
];

function preConverter(rawVideos) {
    return rawVideos.map(
        s => s?.itemSectionRenderer?.contents?.
            map(c => c?.shelfRenderer?.content?.gridRenderer?.items).filter(Boolean).flat()
    ).filter(Boolean).flat();
}

const handler = new BaseDataHandler({
    name: 'sub box videos',
    getVideosFuncs,
    preConverter,
});

export default handler;
