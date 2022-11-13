import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents,
];

const handler = new BaseDataHandler({
    name: 'watch playlist videos',
    getVideosFuncs,
});

export default handler;
