import React from 'react';


export default function VideoStateButton({ icon, title, className, onClick }) {
    className = (className || '') + ' yt-video-user-state-action-button';
    return (
        <div title={title} className={className} onClick={onClick}>{icon}</div>
    );
}