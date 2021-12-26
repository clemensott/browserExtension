importIntoWebsite(function ({ getVideoIdFromUrl }) {
    let intervalId = null;
    let handledVideoIds = new Map();

    document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
        videos.forEach(video => handledVideoIds.set(video.id, false));
    });

    document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
        videoIds.forEach(videoId => handledVideoIds.set(videoId, true));
    });

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
        getVideoContainers().forEach(e => {
            e.style.display = isVideoUnkown(e) || !handledVideoIds.get(getVideoIdFromVideoContainer(e)) ? null : 'none';
        });
    }

    function unhideKnownVideos() {
        getVideoContainers().forEach(e => {
            e.style.display = null;
        });
        handledVideoIds = new Map();
    }

    function startHiding(hideCurrent = true) {
        stopHiding();
        if (hideCurrent) {
            getVideoContainers().forEach(e => {
                handledVideoIds.set(getVideoIdFromVideoContainer(e), true);
            });
        }
        intervalId = setInterval(hideKnownVideos, 1000);
    }

    function stopHiding(unhideElements) {
        intervalId && clearInterval(intervalId);
        intervalId = null;
        if (unhideElements) {
            unhideKnownVideos();
        }
    }

    return {
        startHiding,
        stopHiding,
    }
});