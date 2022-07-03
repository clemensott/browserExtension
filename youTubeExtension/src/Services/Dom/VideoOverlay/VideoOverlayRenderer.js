import React from 'react';
import ReactDOM from 'react-dom';
import VideoOpenIndicator from '../../../components/VideoOpenIndicator';
import VideoState from '../../../components/VideoStates/VideoState';

const videoUserStateNotCollapse = 'yt-video-user-state-container-not-collapse';

export default class VideoOverlayRenderer {
    constructor({
        api,
        videoOpenStorageService,
        videoStateContainerClassName,
        videoOpenContainerClassName,
        onUpdate,
    }) {
        this.api = api;
        this.videoOpenStorageService = videoOpenStorageService;
        this.videoStateContainerClassName = videoStateContainerClassName;
        this.videoOpenContainerClassName = videoOpenContainerClassName;
        this.onUpdate = onUpdate;
        this.dropdownVideoId = null;
    }

    getBaseElement(container, className, additionalClassName, insertReferenceNodeSelector) {
        let element = container.querySelector(`.${className}`);
        if (!element) {
            element = document.createElement('span');
            element.classList.add(className, additionalClassName);
            const refNode = insertReferenceNodeSelector && container.querySelector(insertReferenceNodeSelector);
            container.insertBefore(element, refNode);
        }
        return element;
    }

    renderVideoState({ container, videoId, additionalClassName, insertReferenceNodeSelector }) {
        const element = this.getBaseElement(container, this.videoStateContainerClassName, additionalClassName, insertReferenceNodeSelector);

        const videoUserState = this.api.getVideoUserState(videoId);
        const timestamp = videoUserState?.timestamp || 0;
        if (element.dataset.id === videoId &&
            element.dataset.timestamp >= timestamp) {
            return;
        }
        element.dataset.id = videoId;
        element.dataset.timestamp = timestamp;

        const videoUserStateWithSourcesData = videoUserState ? {
            ...videoUserState,
            sources: videoUserState.sources && videoUserState.sources.map(source => ({
                ...source,
                data: this.api.getSourceFromId(source.sourceId),
            })),
        } : null;

        ReactDOM.render(
            <VideoState
                videoId={videoId}
                videoUserState={videoUserStateWithSourcesData}
                additionalClassName={additionalClassName}
                api={this.api}
                defaultDropdownOpen={videoId === this.dropdownVideoId}
                onVideoUpdate={this.onUpdate}
                onDropdownOpenChange={open => {
                    if (open) {
                        element.classList.add(videoUserStateNotCollapse);
                        this.dropdownVideoId = videoId;
                    } else {
                        element.classList.remove(videoUserStateNotCollapse);
                        this.dropdownVideoId = null;
                    }
                }}
            />,
            element,
        );
    }

    renderVideoOpen({ container, videoId, additionalClassName, insertReferenceNodeSelector }) {
        const element = this.getBaseElement(container, this.videoOpenContainerClassName, additionalClassName, insertReferenceNodeSelector);

        const videoOpen = this.videoOpenStorageService.isVideoOpenFromCache(videoId);
        const wasVideoOpen = element.dataset.videoOpen === 'true';
        if (wasVideoOpen === videoOpen) {
            return;
        }
        element.dataset.videoOpen = videoOpen;

        ReactDOM.render(
            <VideoOpenIndicator videoOpen={videoOpen} />,
            element,
        );
    }

    render({ container, videoId, additionalClassName, insertReferenceNodeSelector = null }) {
        if (!container || !document.contains(container) || !videoId) {
            return;
        }

        this.renderVideoOpen({ container, videoId, additionalClassName, insertReferenceNodeSelector });
        this.renderVideoState({ container, videoId, additionalClassName, insertReferenceNodeSelector });
    }
}