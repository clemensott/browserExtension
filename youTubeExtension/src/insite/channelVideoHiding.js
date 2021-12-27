import getVideoIdFromUrl from '../utils/getVideoIdFromUrl';

let intervalId = null;
let handledVideoIds = new Map();

function getVideoIdFromVideoContainer(container) {
    const a = container.querySelector('a#thumbnail');
    return a && getVideoIdFromUrl(a.href);
}

function isVideoUnkown(container) {
    return !!container.querySelector('span.yt-video-user-state-missing, span.yt-video-user-state-unkown');
}

function getVideoContainers() {
    return document.querySelectorAll("#items > ytd-grid-video-renderer");
}

function hideKnownVideos() {
    const containers = Array.from(getVideoContainers());
    const allHidden = containers.reduce((allHiddenUntilNow, e) => {
        const show = isVideoUnkown(e) || !handledVideoIds.get(getVideoIdFromVideoContainer(e));
        e.style.display = show ? null : 'none';
        return allHiddenUntilNow && !show;
    }, true);

    if (allHidden) {
        console.log('hide count:', containers.length);
        window.scrollTo(0, Math.random() * 400);
    }
}

function unhideKnownVideos() {
    getVideoContainers().forEach(e => {
        e.style.display = null;
    });
    handledVideoIds = new Map();
}

document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
    videos.forEach(video => handledVideoIds.set(video.id, false));
});

document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
    videoIds.forEach(videoId => handledVideoIds.set(videoId, true));

    if (intervalId) {
        hideKnownVideos();
    }
});

function startHiding(hideCurrent = true) {
    stopHiding();
    if (hideCurrent) {
        getVideoContainers().forEach(e => {
            handledVideoIds.set(getVideoIdFromVideoContainer(e), true);
        });
    }
    intervalId = setInterval(hideKnownVideos, 10000);
    hideKnownVideos();
}

function stopHiding(unhideElements) {
    intervalId && clearInterval(intervalId);
    intervalId = null;
    if (unhideElements) {
        unhideKnownVideos();
    }
}


export default {
    startHiding,
    stopHiding,
};