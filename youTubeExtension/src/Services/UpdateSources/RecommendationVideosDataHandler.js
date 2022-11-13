import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.
        secondaryResults?.results?.flatMap(r => r?.itemSectionRenderer?.contents),
    data => data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results,
    data => data?.onResponseReceivedEndpoints[0]?.appendContinuationItemsAction?.continuationItems,
    data => data?.onResponseReceivedEndpoints[0]?.reloadContinuationItemsCommand?.continuationItems,
];

const handler = new BaseDataHandler({
    name: 'recommendation videos',
    getVideosFuncs,
});

export default handler;
