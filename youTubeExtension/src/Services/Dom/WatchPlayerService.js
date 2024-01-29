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
        this.isEndVideoButtonEnabled = optionsService.isEndVideoButtonEnabled;
        this.isSaveTimestampEnabled = optionsService.isSaveTimestampEnabled;
        this.isEndingVideo = false;

        this.onDuractionChange = this.onDuractionChange.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onClickProgressBar = this.onClickProgressBar.bind(this);
        this.handleEndVideo = this.handleEndVideo.bind(this);
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
            endVideoButton,
            progressBar,
        } = obj || {};

        return {
            videoElement: document.contains(videoElement) ? videoElement : WatchPlayerService.getVideoElement(),
            movieContainer: document.contains(movieContainer) ? movieContainer : WatchPlayerService.getMovieContainer(),
            muteButton: document.contains(muteButton) ? muteButton : WatchPlayerService.getMuteButtonr(),
            volumeIndicator: document.contains(volumeIndicator) ? volumeIndicator : WatchPlayerService.getVolumeIndicator(),
            adContainer: document.contains(adContainer) ? adContainer : WatchPlayerService.getAdContainerButton(),
            nextVideoButton: document.contains(nextVideoButton) ? nextVideoButton : WatchPlayerService.getNextVideoButton(),
            endVideoButton: document.contains(endVideoButton) ? endVideoButton : WatchPlayerService.getEndVideoButton(),
            progressBar: document.contains(progressBar) ? progressBar : WatchPlayerService.getProgressBar(),
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

    static getEndVideoButton() {
        return document.querySelector('#movie_player a.yt-extension-end-video');
    }

    static getProgressBar() {
        return document.querySelector('#movie_player div.ytp-progress-bar');
    }

    onChange({ lastElements, currentElements }) {
        if (lastElements?.videoElement !== currentElements?.videoElement) {
            if (lastElements?.videoElement) {
                lastElements.videoElement.removeEventListener('durationchange', this.onDuractionChange);
                lastElements.videoElement.removeEventListener('pause', this.onPause);
            }

            if (currentElements?.videoElement) {
                currentElements.videoElement.addEventListener('durationchange', this.onDuractionChange);
                currentElements.videoElement.addEventListener('pause', this.onPause);
                this.checkIsAdChanged(currentElements);
            }
        }

        if (lastElements?.progressBar !== currentElements?.progressBar) {
            if (lastElements?.progressBar) {
                lastElements.progressBar.removeEventListener('click', this.onClickProgressBar);
            }

            if (currentElements?.progressBar) {
                currentElements.progressBar.addEventListener('click', this.onClickProgressBar);
            }
        }

        if (lastElements?.nextVideoButton !== currentElements?.nextVideoButton) {
            if (lastElements?.nextVideoButton) {
                lastElements.endVideoButton?.remove();
            }

            if (this.isEndVideoButtonEnabled && currentElements?.nextVideoButton && !currentElements.endVideoButton) {
                currentElements.nextVideoButton.classList.add('yt-extension-next-video');

                currentElements.endVideoButton = this.createEndVideoButton();
                currentElements.endVideoButton.addEventListener('click', this.handleEndVideo);
                currentElements.nextVideoButton.parentElement
                    .insertBefore(currentElements.endVideoButton, currentElements.nextVideoButton);
            }
        }
    }


    onDuractionChange() {
        this.checkIsAdChanged();
    }


    isUiMuted() {
        const { volumeIndicator } = this.currentElements;
        return volumeIndicator ? volumeIndicator.style.left === '0px' : null;
    }

    setMuteState(mute, force) {
        const { videoElement } = this.currentElements;
        const isMuted = this.isUiMuted();
        if (force || (typeof isMuted === 'boolean' && isMuted === !!mute)) {
            videoElement.muted = mute;
        }
    }

    isAdvertisingPlayling() {
        const { movieContainer } = this.currentElements;
        return movieContainer && movieContainer.classList.contains('ad-interrupting');
    }

    checkIsAdChanged() {
        const { videoElement } = this.currentElements;
        if (!videoElement || this.isEndingVideo) return;

        const isAdPlayling = this.isAdvertisingPlayling();
        if (isAdPlayling) {
            videoElement.playbackRate = constants.SKIP_AD_PLAYBACKRATE;
            this.setMuteState(true, true);
        } else {
            this.setMuteState(false, false);
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

    onPause() {
        this.updateUrlTimestamp();
    }

    onClickProgressBar() {
        this.updateUrlTimestamp();
    }

    updateUrlTimestamp() {
        const { videoElement } = this.currentElements || {};
        if (this.isSaveTimestampEnabled && videoElement && !this.isAdvertisingPlayling()) {
            const seconds = Math.floor(videoElement.currentTime);
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

    createEndVideoButton() {
        const button = document.createElement('a');
        button.classList.add('yt-extension-end-video');
        button.title = 'Fast forward to end of video';
        button.innerHTML = `
            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                <path class="ytp-svg-fill" d="M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z"></path>
            </svg>`;
        return button;
    }

    handleEndVideo({ target }) {
        const that = this;
        const { videoElement } = this.currentElements;
        if (videoElement.currentTime >= videoElement.duration) {
            return;
        }

        const oldPlaybackRate = videoElement.playbackRate;
        const currentVideoId = getCurrentVideoId();

        function removeHandlers() {
            clearInterval(checkVideoChangedIntervalId);
            that.isEndingVideo = false;
            videoElement.removeEventListener('ended', onEnded);
            target.classList.remove(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
        }

        function checkVideoChanged() {
            if (currentVideoId !== getCurrentVideoId()) {
                removeHandlers();
            }
        }

        function onEnded() {
            if (!this.isAdvertisingPlayling()) {
                if (videoElement.playbackRate === constants.END_VIDEO_PLAYBACKRATE) {
                    videoElement.playbackRate = oldPlaybackRate;

                    const uiMuted = that.isUiMuted();
                    if (typeof uiMuted === 'boolean') {
                        videoElement.muted = false;
                    }
                }
                removeHandlers();
            }
        }

        const checkVideoChangedIntervalId = setInterval(checkVideoChanged, 100);
        videoElement.addEventListener('ended', onEnded);

        that.isEndingVideo = true;
        videoElement.playbackRate = constants.END_VIDEO_PLAYBACKRATE;
        videoElement.muted = true;
        videoElement.play();
        target.classList.add(constants.ENDING_VIDEO_BUTTON_CLASSNAME);
    }
}
