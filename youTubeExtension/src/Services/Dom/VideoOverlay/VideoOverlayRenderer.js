import ReactDOM from 'react-dom';
import VideoOpenIndicator from '../../../components/VideoOpenIndicator';
import VideoState from '../../../components/VideoStates/VideoState';
import RootElement from '../../../components/RootElement';

const videoUserStateNotCollapse = 'yt-video-user-state-container-not-collapse';

export default class VideoOverlayRenderer {
    constructor({
        api,
        videoOpenService,
        videoStateContainerClassName,
        videoOpenContainerClassName,
    }) {
        this.api = api;
        this.videoOpenService = videoOpenService;
        this.videoStateContainerClassName = videoStateContainerClassName;
        this.videoOpenContainerClassName = videoOpenContainerClassName;
    }

    getBaseElement(container, className, additionalClassName, insertReferenceNodeSelector, addRootContainerClass) {
        let element = container.querySelector(`.${className}`);
        if (!element) {
            element = document.createElement('span');
            element.classList.add(className, additionalClassName);
            const refNode = insertReferenceNodeSelector && container.querySelector(insertReferenceNodeSelector);
            container.insertBefore(element, refNode);
        }
        if (addRootContainerClass) {
            container.classList.add(addRootContainerClass);
        }
        return element;
    }

    renderVideoState({ container, videoId, additionalClassName, insertReferenceNodeSelector = null, addRootContainerClass = null }) {
        const element = this.getBaseElement(
            container,
            this.videoStateContainerClassName,
            additionalClassName,
            insertReferenceNodeSelector,
            addRootContainerClass,
        );
        if (element.dataset.id === videoId) {
            return;
        }
        element.dataset.id = videoId;

        ReactDOM.render(
            RootElement(VideoState, {
                videoId,
                api: this.api,
                onDropdownOpenChange: open => {
                    if (open) {
                        element.classList.add(videoUserStateNotCollapse);
                    } else {
                        element.classList.remove(videoUserStateNotCollapse);
                    }
                },
            }),
            element,
        );
    }

    renderVideoOpen({ container, videoId, additionalClassName, insertReferenceNodeSelector = null, addRootContainerClass = null }) {
        const element = this.getBaseElement(
            container,
            this.videoOpenContainerClassName,
            additionalClassName,
            insertReferenceNodeSelector,
            addRootContainerClass,
        );

        const videoOpenTypes = this.videoOpenService.isVideoOpenFromCache(videoId);
        const videoOpen = videoOpenTypes.join(',');
        if (element.dataset.videoOpen === videoOpen) {
            return;
        }
        element.dataset.videoOpen = videoOpen;

        ReactDOM.render(
            VideoOpenIndicator({ videoOpenTypes }),
            element,
        );
    }

    render(params) {
        const { container, videoId } = params;
        if (!container || !document.contains(container) || !videoId) {
            return;
        }

        this.renderVideoOpen(params);
        this.renderVideoState(params);
    }
}