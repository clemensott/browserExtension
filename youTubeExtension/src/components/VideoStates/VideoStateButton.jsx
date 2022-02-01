import React from 'react';


export default function VideoStateButton({ text, title, className, onClick }) {
    className += ' yt-video-user-state-action-button';
    return (
        <div title={title} className={className} onClick={onClick}>{text}</div>
    );
}