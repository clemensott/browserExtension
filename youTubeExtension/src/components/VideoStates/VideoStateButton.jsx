import React from 'react';


export default function VideoStateButton({ text, title, onClick }) {
    return (
        <div title={title} className="yt-video-user-state-action-button" onClick={onClick}>{text}</div>
    );
}