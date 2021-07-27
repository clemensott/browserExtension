const autoMutedKey = 'yt-extension-auto-muted';
let autoMuted = !!localStorage.getItem(autoMutedKey);
let wasAdPlayling = false;
const cachedElements = {};

console.log('init youtube helper. autoMuted:', autoMuted);

function getCachedElement(elementKey, path, callback) {
    let element = cachedElements[elementKey];
    if (!element || !document.body.contains(element)) {
        element = document.querySelector(path);
        if (element) {
            console.log('search element to cache:', elementKey, !!cachedElements[elementKey]);
        }
        cachedElements[elementKey] = element;
        callback && callback(element);
    }
    return cachedElements[elementKey];
}

function getVideoElement() {
    return getCachedElement(
        'videoElement',
        '#movie_player > div.html5-video-container > video',
        videoPlayer => {
            if (videoPlayer) {
                videoPlayer.ondurationchange = () => checkIsAdChanged(videoPlayer);
                checkIsAdChanged(videoPlayer, true);
            }
        });
}

function getMoviePlayerContainerElement() {
    return getCachedElement('moviePlayerElement', '#movie_player');
}

function toggleMute() {
    const muteButton = getCachedElement('muteButton', '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span > button');
    if (muteButton) {
        muteButton.click();
    }
}

function setMuteState(mute, videoElement) {
    if ((!videoElement.muted) !== (!mute)) {
        toggleMute();
        autoMuted = mute;
        localStorage.setItem(autoMutedKey, autoMuted ? '1' : '');
    }
}

function getAdvertisingContainer() {
    return getCachedElement('adContainer', '#movie_player > div.video-ads.ytp-ad-module');
}

function isAdvertisingPlayling() {
    const moviePlayerElement = getMoviePlayerContainerElement();
    return moviePlayerElement && moviePlayerElement.classList.contains('ad-interrupting');
}

function checkIsAdChanged(videoPlayer, trigger) {
    const isAdPlayling = isAdvertisingPlayling();

    if (trigger || isAdPlayling !== wasAdPlayling) onIsAdChange(isAdPlayling, videoPlayer);
    wasAdPlayling = isAdPlayling;
}

function onIsAdChange(isAdPlayling, videoElement) {
    if (!videoElement) return;

    if (isAdPlayling) {
        videoElement.playbackRate = 8;
        setMuteState(true, videoElement);
    } else if (autoMuted) {
        setMuteState(false, videoElement);
    }
}

function skipAdvertisement() {
    const container = getAdvertisingContainer();
    if (container) {
        const skipButton = container.querySelector('button.ytp-ad-skip-button.ytp-button');
        if (skipButton) {
            skipButton.click();
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