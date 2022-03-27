import DomEventHandler from './DomEventHandler';
import { setHidden, setVisable } from '../../utils/DOM/setHideElement';
import './HideWatchVideoElementsService.css';

const allElementDetectorConfigs = {
    dislikeVideo: {
        subContainerSelector: 'ytd-toggle-button-renderer',
        innerHTML: '<g class="style-scope yt-icon"><path d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z" class="style-scope yt-icon"></path></g>',
    },
    downloadVideo: {
        subContainerSelector: 'ytd-download-button-renderer',
        innerHTML: '<g class="style-scope yt-icon"><path d="M17 18V19H6V18H17ZM16.5 11.4L15.8 10.7L12 14.4V4H11V14.4L7.2 10.6L6.5 11.3L11.5 16.3L16.5 11.4Z" class="style-scope yt-icon"></path></g>',
    },
    clipVideo: {
        subContainerSelector: 'ytd-button-renderer',
        innerHTML: '<g class="style-scope yt-icon"><path d="M8,7c0,0.55-0.45,1-1,1S6,7.55,6,7c0-0.55,0.45-1,1-1S8,6.45,8,7z M7,16c-0.55,0-1,0.45-1,1c0,0.55,0.45,1,1,1s1-0.45,1-1 C8,16.45,7.55,16,7,16z M10.79,8.23L21,18.44V20h-3.27l-5.76-5.76l-1.27,1.27C10.89,15.97,11,16.47,11,17c0,2.21-1.79,4-4,4 c-2.21,0-4-1.79-4-4c0-2.21,1.79-4,4-4c0.42,0,0.81,0.08,1.19,0.2l1.37-1.37l-1.11-1.11C8,10.89,7.51,11,7,11c-2.21,0-4-1.79-4-4 c0-2.21,1.79-4,4-4c2.21,0,4,1.79,4,4C11,7.43,10.91,7.84,10.79,8.23z M10.08,8.94L9.65,8.5l0.19-0.58C9.95,7.58,10,7.28,10,7 c0-1.65-1.35-3-3-3S4,5.35,4,7c0,1.65,1.35,3,3,3c0.36,0,0.73-0.07,1.09-0.21L8.7,9.55l0.46,0.46l1.11,1.11l0.71,0.71l-0.71,0.71 L8.9,13.91l-0.43,0.43l-0.58-0.18C7.55,14.05,7.27,14,7,14c-1.65,0-3,1.35-3,3c0,1.65,1.35,3,3,3s3-1.35,3-3 c0-0.38-0.07-0.75-0.22-1.12l-0.25-0.61L10,14.8l1.27-1.27l0.71-0.71l0.71,0.71L18.15,19H20v-0.15L10.08,8.94z M17.73,4H21v1.56 l-5.52,5.52l-2.41-2.41L17.73,4z M18.15,5l-3.67,3.67l1,1L20,5.15V5H18.15z" class="style-scope yt-icon"></path></g>',
    },
    thankVideo: {
        innerHTML: '<g class="style-scope yt-icon"><path d="M16.5,3C19.02,3,21,5.19,21,7.99c0,3.7-3.28,6.94-8.25,11.86L12,20.59l-0.74-0.73l-0.04-0.04C6.27,14.92,3,11.69,3,7.99 C3,5.19,4.98,3,7.5,3c1.4,0,2.79,0.71,3.71,1.89L12,5.9l0.79-1.01C13.71,3.71,15.1,3,16.5,3 M16.5,2c-1.74,0-3.41,0.88-4.5,2.28 C10.91,2.88,9.24,2,7.5,2C4.42,2,2,4.64,2,7.99c0,4.12,3.4,7.48,8.55,12.58L12,22l1.45-1.44C18.6,15.47,22,12.11,22,7.99 C22,4.64,19.58,2,16.5,2L16.5,2z M11.33,10.86c0.2,0.14,0.53,0.26,1,0.36c0.47,0.1,0.86,0.22,1.18,0.35 c0.99,0.4,1.49,1.09,1.49,2.07c0,0.7-0.28,1.27-0.83,1.71c-0.33,0.26-0.73,0.43-1.17,0.54V17h-2v-1.16 c-0.18-0.05-0.37-0.1-0.53-0.19c-0.46-0.23-0.92-0.55-1.18-0.95C9.15,14.48,9.06,14.24,9,14h2c0.05,0.09,0.07,0.18,0.15,0.25 c0.23,0.19,0.54,0.29,0.92,0.29c0.36,0,0.63-0.07,0.82-0.22s0.28-0.35,0.28-0.59c0-0.25-0.11-0.45-0.34-0.6s-0.59-0.27-1.1-0.39 c-1.67-0.39-2.51-1.16-2.51-2.34c0-0.68,0.26-1.26,0.78-1.71c0.28-0.25,0.62-0.43,1-0.54V7h2v1.12c0.46,0.11,0.85,0.29,1.18,0.57 C14.59,9.05,14.9,9.48,15,10h-2c-0.04-0.09-0.1-0.17-0.16-0.24c-0.17-0.19-0.44-0.29-0.81-0.29c-0.32,0-0.56,0.08-0.74,0.24 c-0.17,0.16-0.26,0.36-0.26,0.6C11.03,10.53,11.13,10.72,11.33,10.86z" class="style-scope yt-icon"></path></g>',
    },
    saveVideo: {
        subContainerSelector: 'ytd-button-renderer',
        innerHTML: '<g class="style-scope yt-icon"><path d="M22,13h-4v4h-2v-4h-4v-2h4V7h2v4h4V13z M14,7H2v1h12V7z M2,12h8v-1H2V12z M2,16h8v-1H2V16z" class="style-scope yt-icon"></path></g>',
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
        ].filter(Boolean).map(name => ({
            [name]: allElementDetectorConfigs[name],
        })));

        console.log('const:', this.elementDetectorConfigs);
    }

    start() {
        if (Object.keys(this.elementDetectorConfigs).length) {
            super.start();
        }
    }

    getElements(obj) {
        const output = {};
        let allElements = null;
        let hasAnyElement = false;

        for (const name in this.elementDetectorConfigs) {
            let element = obj && obj[name];
            if (!super.elementsExists(element)) {
                if (allElements === null) {
                    const container = document.querySelector('#top-level-buttons-computed');
                    allElements = container && Array.from(container.childNodes);
                }
                const detectionConfig = this.elementDetectorConfigs[name];
                element = allElements?.find(e => e.querySelector('svg')?.innerHTML === detectionConfig.innerHTML);
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