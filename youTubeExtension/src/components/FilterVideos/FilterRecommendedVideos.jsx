import React, { useEffect, useState } from 'react';
import './FilterRecommendedVideos.css';

function renderFilterChannelOption({ channelName, isMusic, count }) {
    return (
        <option key={channelName} value={JSON.stringify({ channelName, isMusic })}>
            {channelName} {isMusic ? '♪ ' : ''}({count}x)
        </option>
    );
}

export default function FilterRecommendedVideos({ eventProvider, onFilterChange }) {
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        const onChannelsChanged = ({ detail: { channels } }) => {
            setChannels(channels.sort((a, b) => {
                return b.count - a.count || a.channelName.localeCompare(b.channelName);
            }));
        }
        eventProvider.addChannelsChangedEventListener(onChannelsChanged);
        return () => {
            eventProvider.removeChannelsChangedEventListener(onChannelsChanged);
        };
    }, [eventProvider]);

    const getOnChangeHandler = (optionName) => {
        return ({ target }) => onFilterChange({
            [optionName]: JSON.parse(target.value),
        });
    };

    return (
        <div>
            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Watch Status</label>
                    <select onChange={getOnChangeHandler('isWatchted')}>
                        <option value="null">All</option>
                        <option value="true">Watched</option>
                        <option value="false">Not Watched</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Active Status</label>
                    <select onChange={getOnChangeHandler('isActive')}>
                        <option value="null">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Open Status</label>
                    <select onChange={getOnChangeHandler('isOpen')}>
                        <option value="null">All</option>
                        <option value="true">Open</option>
                        <option value="false">Closed</option>
                    </select>
                </div>
            </div>

            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Channels</label>
                    <select onChange={({ target }) => onFilterChange(
                        JSON.parse(target.value),
                    )}>
                        <option value={JSON.stringify({ channelName: null, isMusic: null })}>
                            All
                        </option>
                        {channels.map(renderFilterChannelOption)}
                    </select>
                </div>
            </div>
            Hello Filter: {channels.length}
        </div>
    );
}