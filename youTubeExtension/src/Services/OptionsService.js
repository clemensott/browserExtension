const optionKeys = {
    IS_VIDEO_PLAYER_MANIPULATION_ENABLED: {
        key: 'IS_VIDEO_PLAYER_MANIPULATION_ENABLED',
        defaultValue: true,
    },
    IS_PAUSE_CHANNEL_TRAILER_ENABLED: {
        key: 'IS_PAUSE_CHANNEL_TRAILER_ENABLED',
        defaultValue: false,
    },
    IS_END_VIDEO_BUTTON_ENABLED: {
        key: 'IS_END_VIDEO_BUTTON_ENABLED',
        defaultValue: false,
    },
    IS_DOM_MANIPULATION_ENABLED: {
        key: 'IS_DOM_MANIPULATION_ENABLED',
        defaultValue: false,
    },
    SUBSCRIPTION_BOX_RELOAD_SECONDS: {
        key: 'SUBSCRIPTION_BOX_RELOAD_SECONDS',
        defaultValue: 300,
    },
    IS_SUBSCRIPTION_BOX_RELOAD_ENABLED: {
        key: 'IS_SUBSCRIPTION_BOX_RELOAD_ENABLED',
        defaultValue: false,
    },
    HIDE_DISLIKE_VIDEO_BUTTON: {
        key: 'HIDE_DISLIKE_VIDEO_BUTTON',
        defaultValue: false,
    },
    HIDE_DOWNLOAD_VIDEO_BUTTON: {
        key: 'HIDE_DOWNLOAD_VIDEO_BUTTON',
        defaultValue: false,
    },
    HIDE_CLIP_VIDEO_BUTTON: {
        key: 'HIDE_CLIP_VIDEO_BUTTON',
        defaultValue: false,
    },
    HIDE_THANK_VIDEO_BUTTON: {
        key: 'HIDE_THANK_VIDEO_BUTTON',
        defaultValue: false,
    },
    HIDE_SAVE_VIDEO_BUTTON: {
        key: 'HIDE_SAVE_VIDEO_BUTTON',
        defaultValue: false,
    },
    HIDE_RECOMMENDATION_PROPS: {
        key: 'HIDE_RECOMMENDATION_PROPS',
        defaultValue: false,
    },
    API_BASE_URL: {
        key: 'API_BASE_URL',
        defaultValue: null,
    },
    API_USERNAME: {
        key: 'API_USERNAME',
        defaultValue: null,
    },
    API_PASSWORD: {
        key: 'API_PASSWORD',
        defaultValue: null,
    },
    VIDEO_USER_STATE_UPDATE_INTERVAL: {
        key: 'VIDEO_USER_STATE_UPDATE_INTERVAL',
        defaultValue: 300, // in seconds
    },
};

export default class OptionsService {
    constructor(storage) {
        this.storage = storage;
        this.options = new Map();
    }

    async load() {
        const getObj = Object.values(optionKeys).reduce((obj, { key, defaultValue }) => {
            obj[key] = defaultValue;
            return obj;
        }, {});
        const result = await this.storage.get(getObj);
        this.options.clear();
        Object.entries(result)
            .forEach(([key, value]) => this.options.set(key, value));
    }

    get(key) {
        return this.options.get(key);
    }

    set(key, value) {
        this.options.set(key, value);
        this.storage.set({ [key]: value });
    }

    get isVideoPlayerManipulationEnabled() {
        return this.get(optionKeys.IS_VIDEO_PLAYER_MANIPULATION_ENABLED.key);
    }

    set isVideoPlayerManipulationEnabled(value) {
        return this.set(optionKeys.IS_VIDEO_PLAYER_MANIPULATION_ENABLED.key, value);
    }

    get isPauseChannelTrailerEnabled() {
        return this.get(optionKeys.IS_PAUSE_CHANNEL_TRAILER_ENABLED.key);
    }

    set isPauseChannelTrailerEnabled(value) {
        return this.set(optionKeys.IS_PAUSE_CHANNEL_TRAILER_ENABLED.key, value);
    }

    get isEndVideoButtonEnabled() {
        return this.get(optionKeys.IS_END_VIDEO_BUTTON_ENABLED.key);
    }

    set isEndVideoButtonEnabled(value) {
        return this.set(optionKeys.IS_END_VIDEO_BUTTON_ENABLED.key, value);
    }

    get isDomManipulationEnabled() {
        return this.get(optionKeys.IS_DOM_MANIPULATION_ENABLED.key);
    }

    set isDomManipulationEnabled(value) {
        return this.set(optionKeys.IS_DOM_MANIPULATION_ENABLED.key, value);
    }

    get subscriptionBoxReloadSeconds() {
        return this.get(optionKeys.SUBSCRIPTION_BOX_RELOAD_SECONDS.key);
    }

    set subscriptionBoxReloadSeconds(value) {
        return this.set(optionKeys.SUBSCRIPTION_BOX_RELOAD_SECONDS.key, value);
    }

    get isSubscriptionBoxReloadEnabled() {
        return this.get(optionKeys.IS_SUBSCRIPTION_BOX_RELOAD_ENABLED.key);
    }

    set isSubscriptionBoxReloadEnabled(value) {
        return this.set(optionKeys.IS_SUBSCRIPTION_BOX_RELOAD_ENABLED.key, value);
    }

    get hideDislikeVideoButton() {
        return this.get(optionKeys.HIDE_DISLIKE_VIDEO_BUTTON.key);
    }

    set hideDislikeVideoButton(value) {
        return this.set(optionKeys.HIDE_DISLIKE_VIDEO_BUTTON.key, value);
    }

    get hideDownloadVideoButton() {
        return this.get(optionKeys.HIDE_DOWNLOAD_VIDEO_BUTTON.key);
    }

    set hideDownloadVideoButton(value) {
        return this.set(optionKeys.HIDE_DOWNLOAD_VIDEO_BUTTON.key, value);
    }

    get hideClipVideoButton() {
        return this.get(optionKeys.HIDE_CLIP_VIDEO_BUTTON.key);
    }

    set hideClipVideoButton(value) {
        return this.set(optionKeys.HIDE_CLIP_VIDEO_BUTTON.key, value);
    }

    get hideThankVideoButton() {
        return this.get(optionKeys.HIDE_THANK_VIDEO_BUTTON.key);
    }

    set hideThankVideoButton(value) {
        return this.set(optionKeys.HIDE_THANK_VIDEO_BUTTON.key, value);
    }

    get hideSaveVideoButton() {
        return this.get(optionKeys.HIDE_SAVE_VIDEO_BUTTON.key);
    }

    set hideSaveVideoButton(value) {
        return this.set(optionKeys.HIDE_SAVE_VIDEO_BUTTON.key, value);
    }

    get hideRecommendationPromps() {
        return this.get(optionKeys.HIDE_RECOMMENDATION_PROPS.key);
    }

    set hideRecommendationPromps(value) {
        return this.set(optionKeys.HIDE_RECOMMENDATION_PROPS.key, value);
    }

    get apiBaseUrl() {
        return this.get(optionKeys.API_BASE_URL.key);
    }

    set apiBaseUrl(value) {
        return this.set(optionKeys.API_BASE_URL.key, value);
    }

    get apiUsername() {
        return this.get(optionKeys.API_USERNAME.key);
    }

    set apiUsername(value) {
        return this.set(optionKeys.API_USERNAME.key, value);
    }

    get apiPassword() {
        return this.get(optionKeys.API_PASSWORD.key);
    }

    set apiPassword(value) {
        return this.set(optionKeys.API_PASSWORD.key, value);
    }

    get videoUserStateUpdateInterval() {
        return this.get(optionKeys.VIDEO_USER_STATE_UPDATE_INTERVAL.key);
    }

    set videoUserStateUpdateInterval(value) {
        return this.set(optionKeys.VIDEO_USER_STATE_UPDATE_INTERVAL.key, value);
    }
}

export {
    OptionsService,
    optionKeys,
};