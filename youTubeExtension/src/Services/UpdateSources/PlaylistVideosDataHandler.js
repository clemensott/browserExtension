import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.flatMap(
        t => t.tabRenderer.content?.sectionListRenderer?.contents?.flatMap(
            c1 => c1.itemSectionRenderer?.contents?.flatMap(c2 => c2.playlistVideoListRenderer?.contents),
        ),
    ),
];

const handler = new BaseDataHandler({
    name: 'playlist videos',
    getVideosFuncs,
});

export default handler;
