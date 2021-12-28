import KeysTracker from '../utils/KeysTracker';
import tryIgnore from '../utils/tryIgnore';
import fetchIntersectorService from '../Services/FetchIntersectorService';
import './channelVideoHiding.css';

const constants = {
    UPDATE_COUNT_UPPER_THRESHOLD: 300,
    UPDATE_COUNT_LOWER_THRESHOLD: 120,
    HIDE_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-all',
    HIDE_NOT_ALL_VIDEOS_CLASSNAME: 'yt-channel-video-hiding-not-all',
}

let intervalId = null;
let isWatingToCoolDown = false;
let finishedFetchingVideosUrl = null;
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
    return container.querySelectorAll('ytd-grid-video-renderer').length;
}

function checkHideCount() {
    const container = getContainer();
    if (!container) return;

    if (finishedFetchingVideosUrl && finishedFetchingVideosUrl !== window.location.href) {
        finishedFetchingVideosUrl = null;
        console.log('reset finishedFetchingVideosUrl');
    }

    if (intervalId && !finishedFetchingVideosUrl && isOnChannelVideosSite()) {
        const updateCount = updatingVideoIds.totalCount();
        const videosCount = getCurrentFetchedVideosCount(container);
        console.log('hiding:', isWatingToCoolDown, updateCount, videosCount);

        if (updateCount >= constants.UPDATE_COUNT_UPPER_THRESHOLD ||
            (isWatingToCoolDown && updateCount > constants.UPDATE_COUNT_LOWER_THRESHOLD)) {
            container.classList.add(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);

            isWatingToCoolDown = true;
        } else if (videosCount >= 60) { // when at least the inital 60 videos are loaded
            container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.add(constants.HIDE_ALL_VIDEOS_CLASSNAME);
            window.scrollTo(0, Math.random() * 400); // scroll to trigger loading next videos
            isWatingToCoolDown = false;
        } else {
            container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
            container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
        }
    } else {
        container.classList.remove(constants.HIDE_NOT_ALL_VIDEOS_CLASSNAME);
        container.classList.remove(constants.HIDE_ALL_VIDEOS_CLASSNAME);
    }
}

function onFetchText({ detail: { url, text } }) {
    if (url.startsWith('https://www.youtube.com/youtubei/v1/browse')) {
        try {
            const data = JSON.parse(text);
            const channelVideos = tryIgnore(() => data?.onResponseReceivedActions?.
                map(a => a?.appendContinuationItemsAction?.continuationItems).find(Boolean));

            const lastVideo = channelVideos[channelVideos.length - 1];
            if (lastVideo && lastVideo.gridVideoRenderer) {
                finishedFetchingVideosUrl = window.location.href;
                console.log('finished fetching for:', finishedFetchingVideosUrl);
                checkHideCount();
            }
        } catch (e) {
        }
    }
}

document.addEventListener('updateSources.startHandleVideos', ({ detail: videos }) => {
    updatingVideoIds.add(videos.map(v => v.id));

    if (intervalId) {
        checkHideCount();
    }
});

document.addEventListener('updateSources.endUpdateThumbnails', ({ detail: videoIds }) => {
    updatingVideoIds.remove(videoIds);

    if (intervalId) {
        checkHideCount();
    }
});

function startHiding() {
    stopHiding();

    intervalId = setInterval(() => checkHideCount(), 5000);
    fetchIntersectorService.addOnTextListener(onFetchText);

    const videoCount = isOnChannelVideosSite() && getContainer() && getCurrentFetchedVideosCount(getContainer());
    if (videoCount % 30 !== 0) {
        // is on channel video site and all videos are laoded because videos are loaded in batches of 30 videos
        finishedFetchingVideosUrl = window.location.href;
    }

    checkHideCount();
}

function stopHiding() {
    intervalId && clearInterval(intervalId);
    intervalId = null;
    fetchIntersectorService.removeOnTextListener(onFetchText);

    checkHideCount();
}


export default {
    startHiding,
    stopHiding,
};