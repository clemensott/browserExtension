import React from 'react';


export default function VideoStateDropdownVideoActionButtons({ icon, text, title, onClick }) {
    return (
        <div className="video-state-dropdown-menu-item" title={title} onClick={onClick}>
            {icon} {text}
        </div>
    );
}
