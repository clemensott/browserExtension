import getVideoIdFromUrl from './getVideoIdFromUrl';

export default function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail,a[href^="/watch?"],a[href^="/shorts/"],a.reel-item-endpoint');
    return a ? getVideoIdFromUrl(a.href) : null;
}
