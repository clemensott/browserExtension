const autoMutedKey = 'yt-extension-auto-muted';
let autoMuted = !!localStorage.getItem(autoMutedKey);
let wasAdPlayling = false;
const cachedElements = {
    videoElement: {
        selector: '#movie_player > div.html5-video-container > video',
    },
    moviePlayerElement: {
        selector: '#movie_player',
    },
    muteButton: {
        selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span > button',
    },
    volumeIndicator: {
        selector: '#movie_player div.ytp-volume-slider-handle',
    },
    adContainer: {
        selector: '#movie_player > div.video-ads.ytp-ad-module',
    },
    nextVideoButton: {
        selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > a.ytp-next-button.ytp-button',
    },
    endVideoButton: {
        selector: 'a.yt-extension-end-video',
    },
    volumeButton: {
        selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span',
    },
};
const endingVideoButtonClassName = 'yt-extension-ending-video';
const enableEndVideoButton = localStorage.getItem('yt-extension-end-video') == true;

console.log('init youtube helper. autoMuted:', autoMuted, enableEndVideoButton);

function getCachedElement(cacheContainer, callback) {
    if (!cacheContainer.element || !document.body.contains(element)) {
        element = document.querySelector(cacheContainer.selector);
        cacheContainer.element = element;
        callback && callback(element);
    }
    return cacheContainer.element;
}

function getVideoElement() {
    return getCachedElement(cachedElements.videoElement,
        videoPlayer => {
            if (videoPlayer) {
                videoPlayer.addEventListener('durationchange', () => checkIsAdChanged(videoPlayer));
                checkIsAdChanged(videoPlayer);
            }
        });
}

function toggleMuteButton() {
    const muteButton = getCachedElement(cachedElements.muteButton);
    if (muteButton) {
        muteButton.click();
    }
}

function isUiMuted() {
    const volumeIndicator = getCachedElement(cachedElements.volumeIndicator);
    return volumeIndicator ? volumeIndicator.style.left === '0px' : null;
}

function setMuteState(mute, videoElement) {
    const isMuted = isUiMuted();
    if (typeof isMuted === 'boolean') {
        if (isMuted === !!mute) {
            videoElement.muted = mute;
        }
    }
}

function isAdvertisingPlayling() {
    const moviePlayerElement = getCachedElement(cachedElements.moviePlayerElement);
    return moviePlayerElement && moviePlayerElement.classList.contains('ad-interrupting');
}

function checkIsAdChanged(videoPlayer) {
    onIsAdChange(isAdvertisingPlayling(), videoPlayer);
}

function onIsAdChange(isAdPlayling, videoElement) {
    if (!videoElement) return;

    if (isAdPlayling) {
        videoElement.playbackRate = 8;
        setMuteState(true, videoElement);
    } else {
        setMuteState(false, videoElement);
    }
}

function skipAdvertisement() {
    const container = getCachedElement(cachedElements.adContainer);
    if (container) {
        const skipButton = container.querySelector('button.ytp-ad-skip-button.ytp-button');
        if (skipButton) {
            skipButton.click();
        }
    }
}

function getCurrentVideoId() {
    return new URLSearchParams(window.location.search).get('v');
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

    const newPlaybackRate = 8;
    const oldPlaybackRate = videoElement.playbackRate;
    const currentVideoId = getCurrentVideoId();

    function removeHandlers() {
        videoElement.removeEventListener('ended', onEnded);
        clearInterval(checkVideoChangedIntervalId);
        target.classList.remove(endingVideoButtonClassName);
    }

    function checkVideoChanged() {
        if (currentVideoId !== getCurrentVideoId()) {
            removeHandlers();
        }
    }

    function onEnded() {
        if (!isAdvertisingPlayling()) {
            if (videoElement.playbackRate === newPlaybackRate) {
                videoElement.playbackRate = oldPlaybackRate;
                videoElement.muted = false;
            }
            removeHandlers();
        }
    }

    const checkVideoChangedIntervalId = setInterval(checkVideoChanged, 100);
    videoElement.addEventListener('ended', onEnded);

    videoElement.playbackRate = newPlaybackRate;
    videoElement.muted = true;
    videoElement.play();
    target.classList.add(endingVideoButtonClassName);
}

function addEndVideoHandling() {
    const nextButton = getCachedElement(cachedElements.nextVideoButton);
    if (nextButton) {
        nextButton.classList.add('yt-extension-next-video');
    }

    let endButton = getCachedElement(cachedElements.endVideoButton);
    if (!endButton) {
        const volumeButton = getCachedElement(cachedElements.volumeButton);
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

setInterval(loop, 1000);

const loadVideoPlayerIntervalId = setInterval(
    () => getVideoElement() && clearInterval(loadVideoPlayerIntervalId),
    20);



function getVideoStatsContainer() {
    return document.querySelector("#movie_player > div.html5-video-info-panel");
}

function openVideoStats() {
    const menuElement = document.querySelector("body > div.ytp-popup.ytp-contextmenu > div > div > div:nth-child(7)");
    if (menuElement) {
        menuElement.click();
    }
}

function getPlayingVideoId() {
    const videoStatsContainer = getVideoStatsContainer();
    if (videoStatsContainer && videoStatsContainer.style.display !== 'none') {
        const infoElement = videoStatsContainer.querySelector("div > div:nth-child(1) > span");
        if (infoElement && infoElement.innerText && infoElement.innerText.includes(' / ')) {
            return infoElement.innerText.substring(0, 11);
        }
    } else {
        openVideoStats();
    }
    return null;
}