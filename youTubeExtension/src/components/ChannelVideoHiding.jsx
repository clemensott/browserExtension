import React, { useState } from 'react';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

const hidingValue = 'hiding';
const fastModeValue = 'fast';

export default function ChannelVideoHiding({ service }) {
    const [value, setValue] = useState([
        service.isHiding() && hidingValue,
        service.fastMode && fastModeValue,
    ].filter(Boolean));
    const onChange = (e, newValue) => {
        let hiding = newValue && newValue.includes(hidingValue);
        const fastMode = newValue && newValue.includes(fastModeValue);
        if (e.target.value === fastModeValue && fastMode && !hiding) {
            hiding = true;
            newValue.push(hidingValue);
        }
        if (hiding) {
            service.start();
        } else {
            service.stop();
        }
        service.fastMode = fastMode;
        setValue(newValue);
    };

    return (
        <span className="yt-channel-helper-service-hide-videos-contianer">
            <ToggleButtonGroup
                value={value}
                onChange={onChange}
            >
                <ToggleButton value={hidingValue}>Video hiding</ToggleButton>
                <ToggleButton value={fastModeValue}>Fast Mode</ToggleButton>
            </ToggleButtonGroup>
        </span>
    );
}