import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => [data?.overlay],
];

const handler = new BaseDataHandler({
    name: 'shorts watch',
    getVideosFuncs,
});

export default handler;
