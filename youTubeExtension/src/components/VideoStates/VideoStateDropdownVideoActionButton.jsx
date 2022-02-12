import React from 'react';


export default function VideoStateDropdownVideoActionButtons({ icon, text, title, sources, onClick }) {
    let forText = null;
    if (sources) {
        const firstSource = sources && sources.length && sources[0].data;
        forText = sources.length > 1 ? `${sources.length} Sources` : (
            <i>{firstSource.title || firstSource.localizedTitle}</i>
        );
    }
    return (
        <div className="video-state-dropdown-menu-item" title={title} onClick={onClick}>
            {icon} {text} {forText ? 'for' : ''} {forText || ''}
        </div>
    );
}
