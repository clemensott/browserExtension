import React, { useEffect, useState } from 'react';
import './IsUpdatingIndicator.css';


export default function IsUpdatingIndicator({ trackerService }) {
    const [dataVideoCount, setDataVideoCount] = useState(0);
    const [thumbnailVideoCount, setthumbnailVideoCount] = useState(0);

    const onVideoDataChange = ({ detail: { tracker } }) => {
        setDataVideoCount(tracker.totalCount());
    };

    const onVideoThumbnailDataChange = ({ detail: { tracker } }) => {
        setthumbnailVideoCount(tracker.totalCount());
    };

    useEffect(() => {
        trackerService.addVideoDataChangeEventListener(onVideoDataChange);
        trackerService.addVideoThumbnailsChangeEventListener(onVideoThumbnailDataChange);

        setDataVideoCount(trackerService.videoData.totalCount());
        setthumbnailVideoCount(trackerService.videoThumbnails.totalCount());

        return () => {
            trackerService.removeVideoDataChangeEventListener(onVideoDataChange);
            trackerService.removeVideoThumbnailsChangeEventListener(onVideoThumbnailDataChange);
        };
    }, [trackerService]);

    return (
        <div className='yt-is-updating-indication-container'>
            <div>{dataVideoCount ? `Updating ${dataVideoCount}x data` : ''}</div>
            <div>{thumbnailVideoCount ? `Updating ${thumbnailVideoCount}x thumbnail` : ''}</div>
        </div>
    );
}