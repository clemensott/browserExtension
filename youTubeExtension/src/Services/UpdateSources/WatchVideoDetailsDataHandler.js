import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => [data?.videoDetails],
];

const handler = new BaseDataHandler({
    name: 'watch video details',
    getVideosFuncs,
});

export default handler;
