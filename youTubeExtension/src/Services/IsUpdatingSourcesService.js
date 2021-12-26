import setIntervalUntil from '../utils/setIntervalUntil';

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

export default class IsUpdatingSourcesService {
    constructor() {
        this.dataVideoIds = new Map();
        this.thumbnailVideoIds = new Map();

        this.dataUpdateCountIndicator = document.createElement('div');
        this.thumbnailUpdateCountIndicator = document.createElement('div');

        this.indicatorContainer = document.createElement('div');
        this.indicatorContainer.appendChild(this.dataUpdateCountIndicator);
        this.indicatorContainer.appendChild(this.thumbnailUpdateCountIndicator);

        setIntervalUntil(() => {
            const headerContainer = document.querySelector('#masthead > #container');
            if (!headerContainer) return true;

            const endContainer = headerContainer.querySelector('#end');
            if (!endContainer) return true;

            headerContainer.insertBefore(this.indicatorContainer, endContainer);
            return false;
        }, 100);

        this.updateDataUpdateCountIndicator = this.updateDataUpdateCountIndicator.bind(this);
        this.updateThumbnailDataUpdateCountIndicator = this.updateThumbnailDataUpdateCountIndicator.bind(this);
    }

    updateDataUpdateCountIndicator() {
        const size = this.dataVideoIds.size;
        this.dataUpdateCountIndicator.innerText = size ? `Updating ${size}x data` : '';
    }

    updateThumbnailDataUpdateCountIndicator() {
        const size = this.thumbnailVideoIds.size;
        this.thumbnailUpdateCountIndicator.innerText = size ? `Updating ${size}x thumbnail` : '';
    }

    start() {
        document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
            addVideosIds(videos.map(video => video.id), this.dataVideoIds);
            this.updateDataUpdateCountIndicator();
        });

        document.addEventListener('updateSources.endHandleVideos', ({ detail: videos }) => {
            removeVideosIds(videos.map(video => video.id), this.dataVideoIds);
            setTimeout(this.updateDataUpdateCountIndicator, 50);
        });

        document.addEventListener('updateSources.startUpdateThumbnails', ({ detail: videoIds }) => {
            addVideosIds(videoIds, this.thumbnailVideoIds);
            this.updateThumbnailDataUpdateCountIndicator();
        });

        document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
            removeVideosIds(videoIds, this.thumbnailVideoIds);
            setTimeout(this.updateThumbnailDataUpdateCountIndicator, 50);
        });
    }
}
