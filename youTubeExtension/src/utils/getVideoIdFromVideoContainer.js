import getVideoIdFromUrl from "./getVideoIdFromUrl";

export default function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail');
    return a ? getVideoIdFromUrl(a.href) : null;
}
