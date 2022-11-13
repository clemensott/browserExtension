import BaseDataHandler from './BaseDataHandler';

const getVideosFuncs = [
    data => data?.contents?.twoColumnSearchResultsRenderer?.
        secondaryContents?.secondarySearchContainerRenderer?.contents?.map(
            c => c?.universalWatchCardRenderer?.sections?.map(
                s => s?.watchCardSectionSequenceRenderer?.lists?.map(
                    l => l?.verticalWatchCardListRenderer?.items
                ).filter(Boolean).flat()
            ).filter(Boolean).flat()).
        filter(Boolean).flat(),
];

const handler = new BaseDataHandler({
    name: 'search secondary videos',
    getVideosFuncs,
});

export default handler;
