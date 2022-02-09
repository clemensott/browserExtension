import React, { useState, useRef, useEffect } from 'react';
import './ReloadCheckbox.css';

function RemainingText({ until, onRanDown }) {
    const intervalId = useRef(null);
    const [remaining, setRemaining] = useState(null);

    const update = () => {
        if (until) {
            const remainingText = Math.max(until - Date.now() / 1000, 0).toFixed(0);
            setRemaining(remainingText);
        } else {
            setRemaining(null);
        }
    };

    useEffect(() => {
        if (until) {
            intervalId.current = setInterval(update, 500);
        } else if (intervalId.current) {
            clearInterval(intervalId.current);
            intervalId.current = null;
        }

        update();

        return () => {
            clearInterval(intervalId.current);
            intervalId.current = null;
        };
    }, [until]);

    const isRunDown = remaining && (remaining <= 0);
    useEffect(() => {
        if (isRunDown && typeof onRanDown === 'function') {
            onRanDown();
        }
    }, [isRunDown])

    return remaining ? `in ${remaining}s` : '';
}


export default function ReloadCheckbox({ runDownSeconds, defaultChecked, onChange }) {
    const [until, setIUntil] = useState(null);

    const updateUntil = enable => {
        if (enable) {
            setIUntil(Date.now() / 1000 + runDownSeconds);
        } else {
            setIUntil(null);
        }

        if (typeof onChange === 'function') {
            onChange(enable);
        }
    }
    const onCheckboxChange = e => {
        updateUntil(e.target.checked);
    };

    const reload = () => {
        if (window.location.pathname.startsWith('/feed/subscriptions')) {
            window.location.reload();
        }
    };

    useEffect(() => {
        updateUntil(defaultChecked);
    }, [defaultChecked]);

    return (
        <div className="yt-extension-reload-checkbox-container">
            <input id="auto-reload-page" type="checkbox" defaultChecked={defaultChecked} onChange={onCheckboxChange} />
            <label htmlFor="auto-reload-page">
                Auto Reloading
                <RemainingText until={until} onRanDown={reload} />
            </label>
        </div>
    );
}
