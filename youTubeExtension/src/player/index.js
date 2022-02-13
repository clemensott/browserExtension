import { elementCacheIds, elementCache } from './PlayerElementCache';
import getCurrentVideoId from '../utils/getCurrentVideoId';
import setIntervalUntil from '../utils/setIntervalUntil';
import './index.css';

const constants = {
    ENABLE_END_VIDEO_BUTTON_STORAGE_KEY: 'yt-extension-end-video',
    ENDING_VIDEO_BUTTON_CLASSNAME: 'yt-extension-ending-video',
    SKIP_AD_PLAYBACKRATE: 8,
    END_VIDEO_PLAYBACKRATE: 8,
};

let enableEndVideoButton = false;
let isEndingVideo = false;


function getVideoElement() {
    return elementCache.getElement(elementCacheIds.VIDEO_ELEMENT, onNewVideoPlayer);
}

function onNewVideoPlayer({ newElement: newPlayer, oldELement: oldPlayer }) {
    if (oldPlayer) {
        oldPlayer.removeEventListener('durationchange', onDuractionChange);
    }

    if (newPlayer) {
        newPlayer.addEventListener('durationchange', onDuractionChange);
        checkIsAdChanged(newPlayer);
    }
}

function onDuractionChange(e) {
    checkIsAdChanged(e.target);
}


function isUiMuted() {
    const volumeIndicator = elementCache.getElement(elementCacheIds.VOLUME_INDICATOR);
    return volumeIndicator ? volumeIndicator.style.left === '0px' : null;
}

function setMuteState(mute, force, videoElement) {
    const isMuted = isUiMuted();
    if (force || typeof isMuted === 'boolean') {
        if (force || isMuted === !!mute) {
            videoElement.muted = mute;
        }
    }
}

function isAdvertisingPlayling() {
    const moviePlayerElement = elementCache.getElement(elementCacheIds.MOVIE_PLAYER_ELEMENT);
    return moviePlayerElement && moviePlayerElement.classList.contains('ad-interrupting');
}

function checkIsAdChanged(videoElement) {
    if (!videoElement || isEndingVideo) return;

    const isAdPlayling = isAdvertisingPlayling();
    if (isAdPlayling) {
        videoElement.playbackRate = constants.SKIP_AD_PLAYBACKRATE;
        setMuteState(true, true, videoElement);
    } else {
        setMuteState(false, false, videoElement);
    }
}

function skipAdvertisement() {
    const container = elementCache.getElement(elementCacheIds.AD_CONTAINER);
    if (container) {
        const skipButton = container.querySelector('button.ytp-ad-skip-button.ytp-button');
        if (skipButton) {
            skipButton.click();
        }
    }
}

function createEndVideoButton() {
    const button = document.createElement('a');
    button.classList.add('yt-extension-end-video');
    button.title = 'Fast forward to end of video';
    button.innerHTML = `
        <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
            <path class="ytp-svg-fill" d="M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z"></path>
        </svg>`;
    return button;
}

function handleEndVideo({ target }) {
    const videoElement = getVideoElement();
    if (videoElement.currentTime >= videoElement.duration) {
        return;
    }

    const oldPlaybackRate = videoElement.playbackRate;
    const currentVideoId = getCurrentVideoId();

    function removeHandlers() {
        clearInterval(checkVideoChangedIntervalId);
        isEndingVideo = false;
        videoElement.removeEventListener('ended', onEnded);
        target.classList.remove(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
    }

    function checkVideoChanged() {
        if (currentVideoId !== getCurrentVideoId()) {
            removeHandlers();
        }
    }

    function onEnded() {
        if (!isAdvertisingPlayling()) {
            if (videoElement.playbackRate === constants.END_VIDEO_PLAYBACKRATE) {
                videoElement.playbackRate = oldPlaybackRate;
                videoElement.muted = false;
            }
            removeHandlers();
        }
    }

    const checkVideoChangedIntervalId = setInterval(checkVideoChanged, 100);
    videoElement.addEventListener('ended', onEnded);

    isEndingVideo = true;
    videoElement.playbackRate = constants.END_VIDEO_PLAYBACKRATE;
    videoElement.muted = true;
    videoElement.play();
    target.classList.add(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
}

function addEndVideoHandling() {
    const nextButton = elementCache.getElement(elementCacheIds.NEXT_VIDEO_BUTTON);
    if (nextButton) {
        nextButton.classList.add('yt-extension-next-video');
    }

    let endButton = elementCache.getElement(elementCacheIds.END_VIDEO_BUTTON);
    if (!endButton) {
        const volumeButton = elementCache.getElement(elementCacheIds.VOLUME_BUTTON);
        if (volumeButton) {
            endButton = createEndVideoButton();
            endButton.addEventListener('click', handleEndVideo);
            volumeButton.parentElement.insertBefore(endButton, volumeButton);
        }
    }
}

function loop() {
    const isAdPlayling = isAdvertisingPlayling();
    const videoElement = getVideoElement();
    if (videoElement && isAdPlayling) {
        if (videoElement.currentTime > 32) {
            skipAdvertisement();
        }
    }

    if (enableEndVideoButton) {
        addEndVideoHandling();
    }
}


export default function start(options) {
    enableEndVideoButton = options.isEndVideoButtonEnabled;

    console.log('start player ad handler. enableEndVideoButton:', enableEndVideoButton);

    setInterval(loop, 1000);
    setIntervalUntil(() => !getVideoElement(), 20);
}
