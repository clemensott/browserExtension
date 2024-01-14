import DomEventHandler from './DomEventHandler';
import { setHidden, setVisable } from '../../utils/DOM/setHideElement';
import './HideWatchVideoElementsService.css';

const allElementDetectorConfigs = {
    dislikeVideo: {
        elementsSelector: 'dislike-button-view-model',
        innerHtmlElementSelector: null,
        innerHTML: null,
    },
    downloadVideo: {
        elementsSelector: 'ytd-download-button-renderer',
        innerHtmlElementSelector: null,
        innerHTML: null,
    },
    clipVideo: {
        elementsSelector: 'yt-button-view-model',
        innerHtmlElementSelector: 'path[d="M8 7c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-1 9c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm3.79-7.77L21 18.44V20h-3.27l-5.76-5.76-1.27 1.27c.19.46.3.96.3 1.49 0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4c.42 0 .81.08 1.19.2l1.37-1.37-1.11-1.11C8 10.89 7.51 11 7 11c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4c0 .43-.09.84-.21 1.23zm-.71.71-.43-.44.19-.58c.11-.34.16-.64.16-.92 0-1.65-1.35-3-3-3S4 5.35 4 7s1.35 3 3 3c.36 0 .73-.07 1.09-.21l.61-.24.46.46 1.11 1.11.71.71-.71.71-1.37 1.37-.43.43-.58-.18C7.55 14.05 7.27 14 7 14c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3c0-.38-.07-.75-.22-1.12l-.25-.61.47-.47 1.27-1.27.71-.71.71.71L18.15 19H20v-.15l-9.92-9.91zM17.73 4H21v1.56l-5.52 5.52-2.41-2.41L17.73 4zm.42 1-3.67 3.67 1 1L20 5.15V5h-1.85z"]',
        innerHTML: null,
    },
    thankVideo: {
        elementsSelector: 'yt-button-view-model',
        innerHtmlElementSelector: 'path[d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm5.5-15c-1.74 0-3.41.88-4.5 2.28C10.91 2.88 9.24 2 7.5 2 4.42 2 2 4.64 2 7.99c0 4.12 3.4 7.48 8.55 12.58L12 22l1.45-1.44C18.6 15.47 22 12.11 22 7.99 22 4.64 19.58 2 16.5 2zm-3.75 17.85-.75.74-.74-.73-.04-.04C6.27 14.92 3 11.69 3 7.99 3 5.19 4.98 3 7.5 3c1.4 0 2.79.71 3.71 1.89L12 5.9l.79-1.01C13.71 3.71 15.1 3 16.5 3 19.02 3 21 5.19 21 7.99c0 3.7-3.28 6.94-8.25 11.86z"]',
        innerHTML: null,
    },
    saveVideo: {
        elementsSelector: 'yt-button-view-model',
        innerHtmlElementSelector: 'path[d="M22 13h-4v4h-2v-4h-4v-2h4V7h2v4h4v2zm-8-6H2v1h12V7zM2 12h8v-1H2v1zm0 4h8v-1H2v1z"]',
        innerHTML: null,
    },
    recommendationPromps: {
        elementsSelector: '#contents > ytd-feed-nudge-renderer',
        innerHtmlElementSelector: null,
        innerHTML: null,
    },
};

export default class HideWatchVideoElementsService extends DomEventHandler {
    constructor({ optionsService }) {
        super({
            eventName: 'HideWatchVideoElementsService.change',
            elementsExists: () => false,
            timeout: 3000,
            notFoundTimeout: 200,
        });

        this.elementDetectorConfigs = Object.assign({}, ...[
            optionsService.hideDislikeVideoButton && 'dislikeVideo',
            optionsService.hideDownloadVideoButton && 'downloadVideo',
            optionsService.hideClipVideoButton && 'clipVideo',
            optionsService.hideThankVideoButton && 'thankVideo',
            optionsService.hideSaveVideoButton && 'saveVideo',
            optionsService.hideRecommendationPromps && 'recommendationPromps',
        ].filter(Boolean).map(name => ({
            [name]: allElementDetectorConfigs[name],
        })));
    }

    start() {
        if (Object.keys(this.elementDetectorConfigs).length) {
            super.start();
        }
    }

    getElements(obj) {
        const output = {};
        const allElements = {};
        let hasAnyElement = false;

        for (const name in this.elementDetectorConfigs) {
            let element = obj && obj[name];
            if (!super.elementsExists(element)) {
                const detectionConfig = this.elementDetectorConfigs[name];
                let elements = allElements[detectionConfig.elementsSelector];
                if (!elements) {
                    elements = Array.from(document.querySelectorAll(detectionConfig.elementsSelector));
                    allElements[detectionConfig.elementsSelector] = elements;
                }
                element = elements?.find(e => {
                    if (detectionConfig.innerHtmlElementSelector) {
                        e = e.querySelector(detectionConfig.innerHtmlElementSelector);
                    }
                    return e && (!detectionConfig.innerHTML || e.innerHTML === detectionConfig.innerHTML);
                });
            }

            if (element) {
                output[name] = element;
                hasAnyElement = true;
            }
        }

        return hasAnyElement ? output : null;
    }

    detectChange(newObj, lastObj) {
        return DomEventHandler.detectObjectChange(
            newObj,
            lastObj,
            Object.keys(this.elementDetectorConfigs),
        );
    }

    onChange({ lastElements, currentElements }) {
        Object.values(lastElements || {}).filter(Boolean).forEach(setVisable);
        Object.values(currentElements || {}).filter(Boolean).forEach(setHidden);
    }
}
