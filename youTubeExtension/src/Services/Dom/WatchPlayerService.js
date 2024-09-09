import { buildUrl } from '../../utils/buildUrl';
import getCurrentVideoId from '../../utils/getCurrentVideoId';
import DomEventHandler from './DomEventHandler';
import './WatchPlayerService.css';

const constants = {
    ENDING_VIDEO_BUTTON_CLASSNAME: 'yt-extension-ending-video',
    SKIP_AD_PLAYBACKRATE: 8,
    END_VIDEO_PLAYBACKRATE: 8,
    MAX_AD_PLAYTIME: 32,
};

export class WatchPlayerService extends DomEventHandler {
    constructor(optionsService) {
        super({
            timeout: 1000,
            notFoundTimeout: 100,
        });

        this.isVideoPlayerManipulationEnabled = optionsService.isVideoPlayerManipulationEnabled;
        this.isFastForwardVideoButtonEnabled = optionsService.isFastForwardVideoButtonEnabled;
        this.isSaveTimestampEnabled = optionsService.isSaveTimestampEnabled;
        this.fastForwardVideo = null;

        this.checkPlayerState = this.checkPlayerState.bind(this);
        this.updateUrlTimestamp = this.updateUrlTimestamp.bind(this);
        this.handleFastForwardVideo = this.handleFastForwardVideo.bind(this);
    }

    start() {
        if (this.isVideoPlayerManipulationEnabled) {
            super.start();
        } else {
            document.body.classList.add('disable-video-player-manipulation');
        }
    }

    onTick() {
        super.onTick();
        this.checkAdProgress();
    }

    elementsExists() {
        return false;
    }

    getIntervalTimeount() {
        return document.contains(this.currentElements?.videoElement) ? this.timeout : this.notFoundTimeout;
    }

    getElements(obj) {
        const {
            videoElement,
            movieContainer,
            muteButton,
            volumeIndicator,
            adContainer,
            nextVideoButton,
            fastForwardVideoButton,
        } = obj || {};

        return {
            videoElement: document.contains(videoElement) ? videoElement : WatchPlayerService.getVideoElement(),
            movieContainer: document.contains(movieContainer) ? movieContainer : WatchPlayerService.getMovieContainer(),
            muteButton: document.contains(muteButton) ? muteButton : WatchPlayerService.getMuteButtonr(),
            volumeIndicator: document.contains(volumeIndicator) ? volumeIndicator : WatchPlayerService.getVolumeIndicator(),
            adContainer: document.contains(adContainer) ? adContainer : WatchPlayerService.getAdContainerButton(),
            nextVideoButton: document.contains(nextVideoButton) ? nextVideoButton : WatchPlayerService.getNextVideoButton(),
            fastForwardVideoButton: document.contains(fastForwardVideoButton) ? fastForwardVideoButton : WatchPlayerService.getFastForwardVideoButton(),
        };
    }

    static getVideoElement() {
        return document.querySelector('#movie_player > div.html5-video-container > video');
    }

    static getMovieContainer() {
        return document.querySelector('#movie_player');
    }

    static getMuteButtonr() {
        return document.querySelector('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span > button');
    }

    static getVolumeIndicator() {
        return document.querySelector('#movie_player div.ytp-volume-slider-handle');
    }

    static getAdContainerButton() {
        return document.querySelector('#movie_player > div.video-ads.ytp-ad-module');
    }

    static getNextVideoButton() {
        return document.querySelector('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > a.ytp-next-button.ytp-button');
    }

    static getFastForwardVideoButton() {
        return document.querySelector('#movie_player a.yt-extension-end-video');
    }

    onChange({ lastElements, currentElements }) {
        if (lastElements?.videoElement !== currentElements?.videoElement) {
            if (lastElements?.videoElement) {
                const { videoElement } = lastElements;
                videoElement.removeEventListener('durationchange', this.checkPlayerState);
                videoElement.removeEventListener('durationchange', this.updateUrlTimestamp);
                videoElement.removeEventListener('emptied', this.updateUrlTimestamp);
                videoElement.removeEventListener('seeked', this.updateUrlTimestamp);
                videoElement.removeEventListener('pause', this.updateUrlTimestamp);
                videoElement.removeEventListener('ended', this.updateUrlTimestamp);
            }

            if (currentElements?.videoElement) {
                const { videoElement } = currentElements;
                videoElement.addEventListener('durationchange', this.checkPlayerState);
                videoElement.addEventListener('durationchange', this.updateUrlTimestamp);
                videoElement.addEventListener('emptied', this.updateUrlTimestamp);
                videoElement.addEventListener('seeked', this.updateUrlTimestamp);
                videoElement.addEventListener('pause', this.updateUrlTimestamp);
                videoElement.addEventListener('ended', this.updateUrlTimestamp);
                this.checkPlayerState(currentElements);
            }
        }

        if (lastElements?.nextVideoButton !== currentElements?.nextVideoButton) {
            if (lastElements?.nextVideoButton) {
                const { fastForwardVideoButton } = lastElements;
                fastForwardVideoButton?.remove();
            }

            if (this.isFastForwardVideoButtonEnabled && currentElements?.nextVideoButton && !currentElements.fastForwardVideoButton) {
                currentElements.fastForwardVideoButton = this.createFastForwardVideoButton();

                const { nextVideoButton, fastForwardVideoButton } = currentElements;
                nextVideoButton.classList.add('yt-extension-next-video');
                fastForwardVideoButton.addEventListener('click', this.handleFastForwardVideo);
                nextVideoButton.parentElement.insertBefore(fastForwardVideoButton, nextVideoButton);
            }
        }
    }

    isUiMuted() {
        const { volumeIndicator } = this.currentElements;
        return volumeIndicator ? volumeIndicator.style.left === '0px' : null;
    }

    setPlayerMuted(mute = true) {
        const { videoElement } = this.currentElements;
        videoElement.muted = !!mute;
    }

    restorePlayerMuted() {
        const { videoElement } = this.currentElements;
        const isMuted = this.isUiMuted();
        if (typeof isMuted === 'boolean') {
            videoElement.muted = isMuted;
        }
    }

    isAdvertisingPlayling() {
        const { movieContainer } = this.currentElements;
        return movieContainer && movieContainer.classList.contains('ad-interrupting');
    }

    checkPlayerState() {
        const { videoElement } = this.currentElements;
        if (!videoElement) return;

        const isAdPlayling = this.isAdvertisingPlayling();
        if (isAdPlayling) {
            videoElement.playbackRate = constants.SKIP_AD_PLAYBACKRATE;
            this.setPlayerMuted();
        } else if (this.fastForwardVideo) {
            videoElement.playbackRate = constants.END_VIDEO_PLAYBACKRATE;
            this.setPlayerMuted();
        } else {
            this.restorePlayerMuted();
        }
    }

    checkAdProgress() {
        if (this.currentElements && this.isAdvertisingPlayling()) {
            const { videoElement } = this.currentElements;
            if (videoElement.currentTime > constants.MAX_AD_PLAYTIME) {
                videoElement.currentTime = videoElement.duration - 1;
                // skipAdvertisement();
            }
        }
    }

    skipAdvertisement() {
        const { adContainer } = this.currentElements;
        if (adContainer) {
            const skipButton = adContainer.querySelector('button.ytp-ad-skip-button-modern.ytp-button,button.ytp-ad-skip-button.ytp-button');
            if (skipButton) {
                skipButton.click();
            }
        }
    }

    updateUrlTimestamp() {
        const { videoElement } = this.currentElements || {};
        if (this.isSaveTimestampEnabled && videoElement && !this.isAdvertisingPlayling()) {
            const seconds = videoElement.ended ? 0 : Math.floor(videoElement.currentTime);
            const newUrl = WatchPlayerService.replaceTimestampOfCurrentUrl(seconds);
            history.replaceState(history.state, null, newUrl);
        }
    }

    static replaceTimestampOfCurrentUrl(timestamp) {
        const { origin, pathname, search, hash } = location;
        const params = new URLSearchParams(search);
        if (timestamp) {
            params.set('t', `${timestamp}s`);
        } else {
            params.delete('t');
        }

        return buildUrl({
            origin,
            pathname,
            search: params.toString(),
            hash,
        });
    }

    createFastForwardVideoButton() {
        const button = document.createElement('a');
        button.classList.add('yt-extension-end-video');
        button.title = 'Fast forward to end of video';
        button.innerHTML = `
            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                <path class="ytp-svg-fill yt-extension-fast-forward-path" d="M 12,24 20.5,18 12,12 V 24 z M 22,24 30.5,18 22,12 V 24 z"/>
                <path class="ytp-svg-fill yt-extension-play-path" d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z" />
            </svg>
        `;

        if (this.fastForwardVideo) {
            button.classList.add(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
        }
        return button;
    }

    restoreFastForwardHandling() {
        const { videoElement, fastForwardVideoButton } = this.currentElements;
        const { intervalId, oldPlaybackRate } = this.fastForwardVideo;

        clearInterval(intervalId);

        fastForwardVideoButton.classList.remove(constants.ENDING_VIDEO_BUTTON_CLASSNAME);

        videoElement.playbackRate = oldPlaybackRate;
        this.fastForwardVideo = null;

        this.checkPlayerState();
    }

    handleFastForwardVideo() {
        const { videoElement, fastForwardVideoButton } = this.currentElements;
        if (videoElement.currentTime >= videoElement.duration) {
            return;
        }

        if (this.fastForwardVideo) {
            this.restoreFastForwardHandling();
            return;
        }

        const checkVideoChanged = () => {
            if (this.fastForwardVideo.videoId !== getCurrentVideoId()) {
                this.restoreFastForwardHandling();
            }
        }

        this.fastForwardVideo = {
            oldPlaybackRate: videoElement.playbackRate,
            videoId: getCurrentVideoId(),
            intervalId: setInterval(checkVideoChanged, 100)
        };

        fastForwardVideoButton.classList.add(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
        videoElement.play();
        this.checkPlayerState();
    }
}
