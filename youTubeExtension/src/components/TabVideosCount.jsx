import React from 'react';

export default function TabVideosCount({ title, videosCount, hasVideosFetchingContinuation }) {
    return videosCount ? (
        <div style={{ textAlign: 'center' }}>
            {title}
            <br />
            ({videosCount}{hasVideosFetchingContinuation ? '+' : ''})
        </div>
    ) : title;
}
