import React from 'react';
import './VideoOpenIndicator.css';

export default function VideoOpenIndicator({
    videoOpen,
}) {
    return videoOpen ? (
        <div className="yt-video-open-indicator-container">
            O
        </div>
    ) : null;
}
