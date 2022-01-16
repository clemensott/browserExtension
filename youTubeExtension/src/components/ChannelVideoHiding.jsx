import React from 'react';

export default function ChannelVideoHiding({ service }) {
    const onChange = e => {
        if (e.target.checked) {
            service.start();
        } else {
            service.stop();
        }
    };

    return (
        <span className="yt-channel-helper-service-hide-videos-contianer">
            <input id="channel_video_hiding" type="checkbox" defaultChecked={service.isHiding()} onChange={onChange} />
            <label htmlFor="channel_video_hiding">Video hiding</label>
        </span>
    );
}