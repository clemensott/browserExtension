import React from 'react';
import './VideoOpenIndicator.css';

function compareType(a, b) {
    const types = ['watch', 'playlist'];
    return types.indexOf(a) - types.indexOf(b);
}

function getIcon(type) {
    switch (type) {
        case 'watch':
            return '\u23F5';
        case 'playlist':
            return '\u2630';
        default:
            return '';
    }
}

export default function VideoOpenIndicator({
    videoOpenTypes,
}) {
    const sorted = [...videoOpenTypes].sort(compareType);
    return sorted.length ? (
        <div className="yt-video-open-indicator-container" title="Video is open in other tab">
            {sorted.map(getIcon).join(' ')}
        </div>
    ) : null;
}
