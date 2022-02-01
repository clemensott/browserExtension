import React from 'react';
import VideoStateButton from './VideoStateButton';
import VideoStateDropdown from './VideoStateDropdown';
import './VideoState.css';


function SetWatchedAndInactiveButton({ wrapFunction }) {
    return <VideoStateButton text="&#x2705;" title="Set watched and inactive!" onClick={wrapFunction(({ api, videoId, sourceIds }) => {
        return Promise.all([
            api.updateUserVideo(videoId, true),
            api.deactivateVideo(videoId, sourceIds),
        ]);
    })} />;
}

function SetWatchedButton({ wrapFunction }) {
    return <VideoStateButton text="&#x2705;" title="Set watched and inactive!" onClick={wrapFunction(({ api, videoId }) => {
        return api.updateUserVideo(videoId, true);
    })} />;
}

function SetNoWatchedButton({ wrapFunction }) {
    return <VideoStateButton text="&#x274C;" title="Set not watched!" onClick={wrapFunction(({ api, videoId }) => {
        return api.updateUserVideo(videoId, false);
    })} />;
}

function SetActiveButton({ wrapFunction }) {
    return <VideoStateButton text="&#x2716;" title="Set active!" onClick={wrapFunction(({ api, videoId, sourceIds }) => {
        return api.updateVideoSourcesState({
            videoId,
            sourceIds,
            isActive: true,
        });
    })} />;
}

function SetInactiveButton({ wrapFunction }) {
    return <VideoStateButton text="&#x2713;" title="Set inactive!" onClick={wrapFunction(({ api, videoId, sourceIds }) => {
        return api.deactivateVideo(videoId, sourceIds);
    })} />;
}

function SetDisableDeprecatedButton({ wrapFunction }) {
    return <VideoStateButton text="&#x2716;" title="Remove deprecated inactive!" onClick={wrapFunction(({ api, videoId, sourceIds }) => {
        return api.updateVideoSourcesState({
            videoId,
            sourceIds,
            isActiveDeprecated: false,
        });
    })} />;
}


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

    const createWrapFunction = (sourceIds) => {
        return func => {
            return async () => {
                try {
                    await func({ api, videoId, sourceIds });
                    await api.updateUserStateOfVideos([videoId], true);
                    onVideoUpdate && await onVideoUpdate();
                } catch (e) {
                    console.error('delete video error', e);
                }
            };
        };
    }

    const activeSourceIds = videoUserState.sources.filter(vus => vus.isActive).map(s => s.sourceId);
    const isSingleActive = activeSourceIds.length === 1;
    const inactiveSourceIds = videoUserState.sources.filter(vus => !vus.isActive).map(s => s.sourceId);
    const isSingleInactive = inactiveSourceIds.length === 1;
    const inactiveDeprecatedSourceIds = videoUserState.sources.filter(vus => !vus.isActive && vus.isActiveDeprecated).map(s => s.sourceId);
    const isSingleDeprecatedInactive = inactiveDeprecatedSourceIds.length === 1;

    const dropdown = (
        <VideoStateDropdown
            videoId={videoId}
            apiUrl={api.api.baseUrl}
            onDropdownOpenChange={onDropdownOpenChange}
        />
    );

    if (videoUserState.isWatched) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-watched`}>
                <SetNoWatchedButton wrapFunction={createWrapFunction()} />
                {isSingleActive && <SetInactiveButton wrapFunction={createWrapFunction(activeSourceIds)} />}
                {isSingleInactive && <SetActiveButton wrapFunction={createWrapFunction(inactiveSourceIds)} />}
                {dropdown}
            </div>
        );
    }
    if (isSingleDeprecatedInactive && videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-inactive-depricated`}>
                <SetWatchedButton wrapFunction={createWrapFunction()} />
                <SetDisableDeprecatedButton wrapFunction={createWrapFunction(inactiveDeprecatedSourceIds)} />
                {dropdown}
            </div>
        );
    }
    if (isSingleInactive && videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-inactive`}>
                <SetWatchedButton wrapFunction={createWrapFunction()} />
                <SetActiveButton wrapFunction={createWrapFunction(inactiveSourceIds)} />
                {dropdown}
            </div>
        );
    }
    if (videoUserState.sources.length === 1) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-active`}>
                <SetWatchedAndInactiveButton wrapFunction={createWrapFunction(videoUserState.sources.map(s => s.sourceId))} />
                {isSingleActive && <SetInactiveButton wrapFunction={createWrapFunction(activeSourceIds)} />}
                {isSingleInactive && <SetActiveButton wrapFunction={createWrapFunction(inactiveSourceIds)} />}
                {dropdown}
            </div>
        );
    }
    if (isSingleActive) {
        return (
            <div className={`${additionalClassName} yt-video-user-state-active`}>
                <SetWatchedAndInactiveButton wrapFunction={createWrapFunction(videoUserState.sources.map(s => s.sourceId))} />
                {isSingleActive && <SetInactiveButton wrapFunction={createWrapFunction(activeSourceIds)} />}
                <VideoStateButton
                    text={`${inactiveSourceIds.length} / ${videoUserState.sources.length}`}
                    className="yt-video-user-state-action-button-count"
                />
                {dropdown}
            </div>
        );
    }
    return (
        <div className={`${additionalClassName} yt-video-user-state-active`}>
            <SetWatchedButton wrapFunction={createWrapFunction(videoUserState.sources.map(s => s.sourceId))} />
            {isSingleActive && <SetInactiveButton wrapFunction={createWrapFunction(activeSourceIds)} />}
            <VideoStateButton
                text={`${inactiveSourceIds.length} / ${videoUserState.sources.length}`}
                className="yt-video-user-state-action-button-count"
            />
            {dropdown}
        </div>
    );
}
