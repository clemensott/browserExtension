import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.
        sectionListRenderer?.contents?.flatMap(c => c?.itemSectionRenderer?.contents),
    data => data?.onResponseReceivedCommands?.flatMap(
        r => r?.appendContinuationItemsAction?.continuationItems?.flatMap(
            i => i?.itemSectionRenderer?.contents
        ),
    ),
];

function getExtendedVideo(raw) {
    return raw?.shelfRenderer?.content?.verticalListRenderer?.items;
}

function preConverter(rawVideos) {
    return rawVideos
        .flatMap(raw => getExtendedVideo(raw) || raw);
}

const handler = new BaseDataHandler({
    name: 'search primary videos',
    getVideosFuncs,
    preConverter,
});

export default handler;
