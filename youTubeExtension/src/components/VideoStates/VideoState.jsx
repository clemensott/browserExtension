import React from 'react';
import VideoStateButton from './VideoStateButton';
import VideoStateDropdown from './VideoStateDropdown';
import './VideoState.css';


const actionButtonConfig = {
    setWatchedAndInactive: {
        icon: '\u2705',
        text: 'Watched',
        title: 'Set watched and inactive!',
        run: ({ api, videoId, sourceIds }) => {
            return Promise.all([
                api.updateUserVideo(videoId, true),
                api.deactivateVideo(videoId, sourceIds),
            ]);
        },
    },
    setWatched: {
        icon: '\u2705',
        text: 'Watched',
        title: 'Set watched!',
        run: ({ api, videoId }) => {
            return api.updateUserVideo(videoId, true);
        },
    },
    setNotWatched: {
        icon: '\u274C',
        text: 'Not watched',
        title: 'Set not watched!',
        run: ({ api, videoId }) => {
            return api.updateUserVideo(videoId, false);
        },
    },
    setActive: {
        icon: '\u2716',
        text: 'Activate',
        title: 'Set active!',
        run: ({ api, videoId, sourceIds }) => {
            return api.updateVideoSourcesState({
                videoId,
                sourceIds,
                isActive: true,
            });
        },
    },
    setInactive: {
        icon: '\u2713',
        text: 'Deactivate',
        title: 'Set inactive!',
        run: ({ api, videoId, sourceIds }) => {
            return api.deactivateVideo(videoId, sourceIds);
        },
    },
    setDisableDeprecated: {
        icon: '\u2716',
        text: 'Remove deprecated',
        title: 'Remove deprecated inactive!',
        run: ({ api, videoId, sourceIds }) => {
            return api.updateVideoSourcesState({
                videoId,
                sourceIds,
                isActiveDeprecated: false,
            });
        },
    },
};


export default function VideoState({ videoId, videoUserState, additionalClassName, api, onVideoUpdate, onDropdownOpenChange }) {
    if (!videoUserState) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-unkown`} />
        );
    }
    if (!videoUserState?.sources?.length) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-missing`}>
                <VideoStateButton />
            </div>
        );
    }

    const createWrapFunction = (func, sourceIds) => {
        return async () => {
            try {
                await func({ api, videoId, sourceIds });
                await api.updateUserStateOfVideos([videoId], true);
                onVideoUpdate && await onVideoUpdate();
            } catch (e) {
                console.error('delete video error', e);
            }
        };
    }

    function createActionButton(config, sourceId) {
        if (sourceId && !Array.isArray(sourceId)) {
            sourceId = [sourceId];
        }
        return {
            ...config,
            onClick: createWrapFunction(config.run, sourceId),
        };
    }

    function createActionButtons(config, sourceIds = [undefined]) {
        return sourceIds.map(sourceId => createActionButton(config, sourceId));
    }

    const activeSourceIds = videoUserState.sources.filter(vus => vus.isActive).map(s => s.sourceId);
    const isSingleActive = activeSourceIds.length === 1;
    const inactiveSourceIds = videoUserState.sources.filter(vus => !vus.isActive).map(s => s.sourceId);
    const isSingleInactive = inactiveSourceIds.length === 1;
    const inactiveDeprecatedSourceIds = videoUserState.sources.filter(vus => !vus.isActive && vus.isActiveDeprecated).map(s => s.sourceId);
    const isSingleDeprecatedInactive = inactiveDeprecatedSourceIds.length === 1;

    const Dropdown = ({ actionButtons }) => {
        return (
            <VideoStateDropdown
                videoId={videoId}
                apiUrl={api.api.baseUrl}
                onDropdownOpenChange={onDropdownOpenChange}
                actionButtons={actionButtons}
            />
        )
    };

    if (videoUserState.isWatched) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-watched`}>
                <VideoStateButton {...createActionButton(actionButtonConfig.setNotWatched)} />
                <Dropdown
                    actionButtons={[
                        ...createActionButtons(actionButtonConfig.setInactive, activeSourceIds),
                        ...createActionButtons(actionButtonConfig.setActive, inactiveSourceIds),
                    ]}
                />
            </div>
        );
    }
    if (isSingleDeprecatedInactive && videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-inactive-depricated`}>
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatched)} />
                <Dropdown actionButtons={
                    createActionButtons(actionButtonConfig.setDisableDeprecated, isSingleDeprecatedInactive)
                } />
            </div>
        );
    }
    if (isSingleInactive && videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-inactive`}>
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatched)} />
                <Dropdown actionButtons={
                    createActionButtons(actionButtonConfig.setActive, inactiveSourceIds)
                } />
            </div>
        );
    }
    if (isSingleActive && videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-active`}>
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatchedAndInactive, activeSourceIds)} />
                <Dropdown actionButtons={
                    createActionButtons(actionButtonConfig.setInactive, activeSourceIds)
                } />
            </div>
        );
    }
    const allSourceIds = videoUserState.sources.map(s => s.sourceId);
    return (
        <div className={`${additionalClassName} yt-video-user-state-active`}>
            <VideoStateButton {...createActionButton(actionButtonConfig.setWatchedAndInactive, allSourceIds)} />
            <Dropdown
                actionButtons={[
                    ...createActionButtons(actionButtonConfig.setInactive, activeSourceIds),
                    ...createActionButtons(actionButtonConfig.setActive, inactiveSourceIds),
                ]}
            />
        </div>
    );
}
