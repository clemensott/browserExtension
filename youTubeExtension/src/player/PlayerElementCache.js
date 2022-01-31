import ElementCacheService from '../Services/Dom/ElementCacheService';

export const elementCacheIds = {
    AUTO_MUTED_KEY: 'yt-extension-auto-muted',
    ENDING_VIDEO_BUTTON_CLASSNAME: 'yt-extension-ending-video',
    VIDEO_ELEMENT: 'videoElement',
    MOVIE_PLAYER_ELEMENT: 'moviePlayerElement',
    MUTE_BUTTON: 'muteButton',
    VOLUME_INDICATOR: 'volumeIndicator',
    AD_CONTAINER: 'adContainer',
    NEXT_VIDEO_BUTTON: 'nextVideoButton',
    END_VIDEO_BUTTON: 'endVideoButton',
    VOLUME_BUTTON: 'volumeButton',
};

export const elementCache = new ElementCacheService([{
    id: elementCacheIds.VIDEO_ELEMENT,
    selector: '#movie_player > div.html5-video-container > video',
}, {
    id: elementCacheIds.MOVIE_PLAYER_ELEMENT,
    selector: '#movie_player',
}, {
    id: elementCacheIds.MUTE_BUTTON,
    selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span > button',
}, {
    id: elementCacheIds.VOLUME_INDICATOR,
    selector: '#movie_player div.ytp-volume-slider-handle',
}, {
    id: elementCacheIds.AD_CONTAINER,
    selector: '#movie_player > div.video-ads.ytp-ad-module',
}, {
    id: elementCacheIds.NEXT_VIDEO_BUTTON,
    selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > a.ytp-next-button.ytp-button',
}, {
    id: elementCacheIds.END_VIDEO_BUTTON,
    selector: 'a.yt-extension-end-video',
}, {
    id: elementCacheIds.VOLUME_BUTTON,
    selector: '#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span',
}]);

export default {
    elementCacheIds,
    elementCache,
};
