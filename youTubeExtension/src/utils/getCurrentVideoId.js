import getVideoIdFromUrl from './getVideoIdFromUrl';

export default function getCurrentVideoId() {
    return getVideoIdFromUrl(window.location.href);
}
