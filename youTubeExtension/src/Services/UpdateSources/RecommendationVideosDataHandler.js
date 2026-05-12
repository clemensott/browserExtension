import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results,
    data => data?.onResponseReceivedEndpoints[0]?.appendContinuationItemsAction?.continuationItems,
    data => data?.onResponseReceivedEndpoints[0]?.reloadContinuationItemsCommand?.continuationItems,
];

function getExtendedVideo(raw) {
    return raw?.itemSectionRenderer?.itemSectionRenderer?.contents || raw?.itemSectionRenderer?.contents;
}

function preConverter(rawVideos) {
    return rawVideos.flatMap(raw => getExtendedVideo(raw) || raw);
}

const handler = new BaseDataHandler({
    name: 'recommendation videos',
    getVideosFuncs,
    preConverter,
});

export default handler;
