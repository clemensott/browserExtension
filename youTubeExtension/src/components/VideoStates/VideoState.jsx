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
        icon: '\u21B6',
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
        icon: '\u21B6',
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


export default function VideoState({ videoId, videoUserState, api, defaultDropdownOpen, onVideoUpdate, onDropdownOpenChange }) {
    if (!videoUserState) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-unkown" />
        );
    }
    if (!videoUserState?.sources?.length) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-missing">
                <VideoStateButton />
            </div>
        );
    }

    const createWrapFunction = (func, sources) => {
        return async () => {
            try {
                const sourceIds = sources && sources.map(s => s.sourceId);
                await func({ api, videoId, sourceIds });
                await api.updateUserStateOfVideos([videoId], true);
                onVideoUpdate && await onVideoUpdate();
            } catch (e) {
                console.error('delete video error', e);
            }
        };
    }

    function createActionButton(config, source) {
        if (source && !Array.isArray(source)) {
            source = [source];
        }
        return {
            ...config,
            sources: source,
            onClick: createWrapFunction(config.run, source),
        };
    }

    function createActionButtons(config, sources = [undefined]) {
        try {
            return sources.map(source => createActionButton(config, source));
        } catch (err) {
            console.error('createActionButtons:', config, sources, err);
        }
    }

    const activeForSources = videoUserState.sources.filter(vus => vus.isActive);
    const isSingleActive = activeForSources.length === 1;
    const inactiveForSources = videoUserState.sources.filter(vus => !vus.isActive);
    const isSingleInactive = inactiveForSources.length === 1;
    const inactiveDeprecatedForSources = videoUserState.sources.filter(vus => !vus.isActive && vus.isActiveDeprecated);
    const isSingleDeprecatedInactive = inactiveDeprecatedForSources.length === 1;

    const AdditionalActionButtons = ({ actionButtons }) => {
        let firstActionButton = null;
        const activeSources = actionButtons.filter(a => a.sources && a.sources.length && a.sources.every(s => s.data && s.data.isActive));
        if (activeSources.length === 1) {
            firstActionButton = activeSources[0];
            const index = actionButtons.indexOf(firstActionButton);
            actionButtons.splice(index, 1);
        }
        return (
            <>
                {
                    firstActionButton ? (
                        <VideoStateButton {...firstActionButton} />
                    ) : null
                }
                <VideoStateDropdown
                    videoId={videoId}
                    apiUrl={api.api.baseUrl}
                    defaultOpen={defaultDropdownOpen}
                    onDropdownOpenChange={onDropdownOpenChange}
                    actionButtons={actionButtons}
                />
            </>
        )
    };

    if (videoUserState.isWatched) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-watched">
                <VideoStateButton {...createActionButton(actionButtonConfig.setNotWatched)} />
                <AdditionalActionButtons
                    actionButtons={[
                        ...createActionButtons(actionButtonConfig.setInactive, activeForSources),
                        ...createActionButtons(actionButtonConfig.setActive, inactiveForSources),
                    ]}
                />
            </div>
        );
    }
    if (isSingleDeprecatedInactive && videoUserState.sources.length === 1) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-inactive-depricated">
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatched)} />
                <AdditionalActionButtons actionButtons={
                    createActionButtons(actionButtonConfig.setDisableDeprecated, inactiveDeprecatedForSources)
                } />
            </div>
        );
    }
    if (isSingleInactive && videoUserState.sources.length === 1) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-inactive">
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatched)} />
                <AdditionalActionButtons actionButtons={
                    createActionButtons(actionButtonConfig.setActive, inactiveForSources)
                } />
            </div>
        );
    }
    if (isSingleActive && videoUserState.sources.length === 1) {
        return (
            <div className="yt-video-user-state-item yt-video-user-state-active">
                <VideoStateButton {...createActionButton(actionButtonConfig.setWatchedAndInactive, activeForSources)} />
                <AdditionalActionButtons actionButtons={
                    createActionButtons(actionButtonConfig.setInactive, activeForSources)
                } />
            </div>
        );
    }
    return (
        <div className="yt-video-user-state-item yt-video-user-state-active">
            <VideoStateButton {...createActionButton(actionButtonConfig.setWatchedAndInactive, videoUserState.sources)} />
            <AdditionalActionButtons
                actionButtons={[
                    ...createActionButtons(actionButtonConfig.setInactive, activeForSources),
                    ...createActionButtons(actionButtonConfig.setActive, inactiveForSources),
                ]}
            />
        </div>
    );
}
