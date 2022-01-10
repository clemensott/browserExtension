import KeysTracker from '../utils/KeysTracker';
import './channelVideoHiding.css';

const constants = {
    UPDATE_COUNT_UPPER_THRESHOLD: 300,
    UPDATE_COUNT_LOWER_THRESHOLD: 120,
    HIDE_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-all',
    HIDE_NOT_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-not-all',
}

let intervalId = null;
let isWatingToCoolDown = false;
const updatingVideoIds = new KeysTracker();

function isOnChannelVideosSite() {
    const pathParts = window.location.pathname.split('/');
    return (
        pathParts.length === 4 && ['c', 'channel', 'user'].includes(pathParts[1]) ||
        pathParts.length === 3
    ) && pathParts[pathParts.length - 1] === 'videos';
}

function getContainer() {
    return document.querySelector('#items.style-scope.ytd-grid-renderer');
}

function getCurrentFetchedVideosCount(container) {
    return container.childElementCount;
}

function finisedFetchingVideos(container) {
    return !container.querySelector('ytd-continuation-item-renderer');
}

function checkHideCount(log = false) {
    const container = getContainer();
    if (!container) return;

    if (intervalId && !finisedFetchingVideos(container) && isOnChannelVideosSite()) {
        const updateCount = updatingVideoIds.totalCount();
        if (log) {
            const videosCount = getCurrentFetchedVideosCount(container);
            console.log('hiding:', { isWatingToCoolDown, updateCount, videosCount });
        }

        if (updateCount >= constants.UPDATE_COUNT_UPPER_THRESHOLD ||
            (isWatingToCoolDown && updateCount > constants.UPDATE_COUNT_LOWER_THRESHOLD)) {
            container.classList.add(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);

            isWatingToCoolDown = true;
        } else {
            container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.add(constants.HIDE_ALL_VIDEOS_CLASSNAME);
            window.scrollTo(0, Math.random() * 400); // scroll to trigger loading next videos
            isWatingToCoolDown = false;
        }
    } else {
        container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
        container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
    }
}

document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
    updatingVideoIds.add(videos.map(v => v.id));

    setTimeout(() => intervalId && checkHideCount(), 100);
});

document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
    updatingVideoIds.remove(videoIds);

    if (intervalId) {
        checkHideCount();
    }
});

function startHiding() {
    stopHiding();
    intervalId = setInterval(() => checkHideCount(true), 5000);

    checkHideCount(true);
}

function stopHiding() {
    intervalId && clearInterval(intervalId);
    intervalId = null;

    checkHideCount();
}


export default {
    startHiding,
    stopHiding,
};