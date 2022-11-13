import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => [data?.contents?.twoColumnWatchNextResults?.results?.results?.contents],
];

function getAdditionalData(data) {
    return data?.currentVideoEndpoint?.watchEndpoint?.videoId;
}

const handler = new BaseDataHandler({
    name: 'watch video',
    getVideosFuncs,
    getAdditionalData,
});

export default handler;
