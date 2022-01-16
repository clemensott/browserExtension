import React, { useEffect, useState } from 'react';
import './IsUpdatingIndicator.css';


function addVideosIds(videoIds, map) {
    videoIds.forEach(videoId => {
        const count = map.get(videoId) || 0;
        map.set(videoId, count + 1);
    });
}

function removeVideosIds(videoIds, map) {
    videoIds.forEach(videoId => {
        const count = map.get(videoId) || 0;
        if (count > 1) map.set(videoId, count - 1);
        else map.delete(videoId);
    });
}

export default function IsUpdatingIndicator() {
    const [dataVideoIds] = useState(new Map());
    const [dataVideoCount, setDataVideoCount] = useState(0);
    const [thumbnailVideoIds] = useState(new Map());
    const [thumbnailVideoCount, setthumbnailVideoCount] = useState(0);

    const startHandleVideos = ({ detail: videos }) => {
        addVideosIds(videos.map(video => video.id), dataVideoIds);
        setDataVideoCount(dataVideoIds.size);
    };

    const endHandleVideos = ({ detail: videos }) => {
        removeVideosIds(videos.map(video => video.id), dataVideoIds);
        setDataVideoCount(dataVideoIds.size);
    };

    const startUpdateThumbnails = ({ detail: videoIds }) => {
        addVideosIds(videoIds, thumbnailVideoIds);
        setthumbnailVideoCount(thumbnailVideoIds.size);
    };

    const endUpdateThumbnails = ({ detail: videoIds }) => {
        removeVideosIds(videoIds, thumbnailVideoIds);
        setthumbnailVideoCount(thumbnailVideoIds.size);
    };


    useEffect(() => {
        document.addEventListener('updateSources.startHandleVideos', startHandleVideos);
        document.addEventListener('updateSources.endHandleVideos', endHandleVideos);
        document.addEventListener('updateSources.startUpdateThumbnails', startUpdateThumbnails);
        document.addEventListener('updateSources.endUpdateThumbnails', endUpdateThumbnails);

        return () => {
            document.removeEventListener('updateSources.startHandleVideos', startHandleVideos);
            document.removeEventListener('updateSources.endHandleVideos', endHandleVideos);
            document.removeEventListener('updateSources.startUpdateThumbnails', startUpdateThumbnails);
            document.removeEventListener('updateSources.endUpdateThumbnails', endUpdateThumbnails);
        };
    }, []);

    return (
        <div className='yt-is-updating-indication-container'>
            <div>{dataVideoCount ? `Updating ${dataVideoCount}x data` : ''}</div>
            <div>{thumbnailVideoCount ? `Updating ${thumbnailVideoCount}x thumbnail` : ''}</div>
        </div>
    );
}