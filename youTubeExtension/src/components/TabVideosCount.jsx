import React from 'react';

export default function TabVideosCount({ title, videosCount, hasVideosFetchingContinuation }) {
    console.log('render tab videos count:', title, videosCount, hasVideosFetchingContinuation);
    return (
        <div style={{ textAlign: 'center' }}>
            {title}
            <br />
            ({videosCount}{hasVideosFetchingContinuation ? '+' : ''})
        </div>
    );
}
