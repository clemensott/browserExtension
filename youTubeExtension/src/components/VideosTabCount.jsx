import React from 'react';

export default function VideosTabCount(props) {
    const { videosCount, hasVideosFetchingContinuation, oldText } = props || {};
    return videosCount ? (
        <div style={{ textAlign: 'center' }}>
            Videos
            <br />
            ({videosCount}{hasVideosFetchingContinuation ? '+' : ''})
        </div>
    ) : 'Videos';
}
