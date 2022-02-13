import React from 'react';
import VideoStateDropwdownSeparator from './VideoStateDropwdownSeparator';
import VideoStateDropdownVideoActionButton from './VideoStateDropdownVideoActionButton';


export default function VideoStateDropdownVideoActionButtons({ buttons }) {
    return Array.isArray(buttons) && buttons.length ? (
        <>
            <VideoStateDropwdownSeparator />
            {
                buttons.map((button, i) => (
                    <VideoStateDropdownVideoActionButton key={i} {...button} />
                ))
            }
        </>
    ) : null;
}
