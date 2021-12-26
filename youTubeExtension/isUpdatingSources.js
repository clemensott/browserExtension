importIntoWebsite(async function ({ setIntervalUntil }) {
    const dataVideoIds = new Map();
    const thumbnailVideoIds = new Map();

    const dataUpdateCountIndicator = document.createElement('div');
    const thumbnailUpdateCountIndicator = document.createElement('div');

    const indicatorContainer = document.createElement('div');
    indicatorContainer.appendChild(dataUpdateCountIndicator);
    indicatorContainer.appendChild(thumbnailUpdateCountIndicator);

    setIntervalUntil(() => {
        const headerContainer = document.querySelector('#masthead > #container');
        if (!headerContainer) return true;

        const endContainer = headerContainer.querySelector('#end');
        if (!endContainer) return true;

        headerContainer.insertBefore(indicatorContainer, endContainer);
        return false;
    }, 100);

    function addVideosIds(videoIds, map) {
        videoIds.forEach(videoId => {
            const count = map.get(videoId) || 0;
            map.set(videoId, count + 1);
        });
    }

    function removeVideosIds(videoIds, map) {
        videoIds.forEach(videoId => {
            const count = map.get(videoId) || 0;
            if (count > 1) map.set(videoId, count - 1);
            else map.delete(videoId);
        });
    }

    function updateDataUpdateCountIndicator() {
        dataUpdateCountIndicator.innerText = dataVideoIds.size ? `Updating ${dataVideoIds.size}x data` : '';
    }

    function updateThumbnailDataUpdateCountIndicator() {
        thumbnailUpdateCountIndicator.innerText = thumbnailVideoIds.size ? `Updating ${thumbnailVideoIds.size}x thumbnail` : '';
    }

    document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
        addVideosIds(videos.map(video => video.id), dataVideoIds);
        updateDataUpdateCountIndicator();
    });

    document.addEventListener('updateSources.endHandleVideos', ({ detail: videos }) => {
        removeVideosIds(videos.map(video => video.id), dataVideoIds);
        setTimeout(updateDataUpdateCountIndicator, 50);
    });

    document.addEventListener('updateSources.startUpdateThumbnails', ({ detail: videoIds }) => {
        addVideosIds(videoIds, thumbnailVideoIds);
        updateThumbnailDataUpdateCountIndicator();
    });

    document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
        removeVideosIds(videoIds, thumbnailVideoIds);
        setTimeout(updateThumbnailDataUpdateCountIndicator, 50);
    });
});