import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.
        flatMap(t => t?.tabRenderer.content.richGridRenderer.contents),
    data => data?.onResponseReceivedActions?.
        flatMap(r => r?.appendContinuationItemsAction?.continuationItems),
    data => data?.onResponseReceivedActions?.
        flatMap(r => r?.reloadContinuationItemsCommand?.continuationItems),
];

function getExtendedVideo(raw) {
    return raw?.richSectionRenderer?.content?.richShelfRenderer?.contents;
}

function preConverter(rawVideos) {
    return rawVideos
        .flatMap(raw => getExtendedVideo(raw) || raw)
        .map(raw => raw?.richItemRenderer?.content);
}

const handler = new BaseDataHandler({
    name: 'home',
    getVideosFuncs,
    preConverter,
});

export default handler;
