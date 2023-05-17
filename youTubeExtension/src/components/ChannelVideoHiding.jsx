import React, { useState } from 'react';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

const hidingValue = 'hiding';

export default function ChannelVideoHiding({ service }) {
    const [value, setValue] = useState(service.isHiding() ? hidingValue : '');
    const onChange = (e, newValue) => {
        if (newValue && newValue.length) {
            service.start();
        } else {
            service.stop();
        }
        setValue(newValue);
    };

    return (
        <span className="yt-channel-helper-service-hide-videos-contianer">
            <ToggleButtonGroup
                value={value}
                onChange={onChange}
            >
                <ToggleButton value={hidingValue}>Video hiding</ToggleButton>
            </ToggleButtonGroup>
        </span>
    );
}