import React from 'react';
import { openVideoType } from '../constants';
import './VideoOpenIndicator.css';

const typesOrder = [
    openVideoType.WATCH,
    openVideoType.DISCARDED,
    openVideoType.PLAYLIST,
    openVideoType.BOOKMARK,
];

function compareType(a, b) {
    return typesOrder.indexOf(a) - typesOrder.indexOf(b);
}

function getIcon(type) {
    switch (type) {
        case openVideoType.WATCH:
            return '\u23F5';
        case openVideoType.PLAYLIST:
            return '\u2630';
        case openVideoType.DISCARDED:
            return '\u2716';
        case openVideoType.BOOKMARK:
            return '🔖';
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
