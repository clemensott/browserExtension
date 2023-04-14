import React, { useEffect, useState } from 'react';
import './FilterRecommendedVideos.css';

function ChannelMusicIcon(isMusic) {
    return isMusic ? (
        <svg
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
            className="style-scope yt-icon"
            style={{ pointerEvents: 'none', display: 'block', width: '100%', height: '100%' }}
        >
            <g className="style-scope yt-icon">
                <path d="M12,4v9.38C11.27,12.54,10.2,12,9,12c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4V8h6V4H12z" className="style-scope yt-icon"></path>
            </g>
        </svg >
    ) : null;
}

function renderFilterChannelOption({ channelName, isMusic, count }) {
    return (
        <option key={channelName}>
            {/* <ChannelMusicIcon isMusic={isMusic} />  */}
            {channelName} ({count}x)
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

    return (
        <div>
            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Watch Status</label>
                    <select onChange={e => {
                        onFilterChange({
                            isWatchted: JSON.parse(e.target.value),
                        });
                    }}>
                        <option value="null">All</option>
                        <option value="true">Watched</option>
                        <option value="false">Not Watched</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Active Status</label>
                    <select>
                        <option>All</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Open Status</label>
                    <select>
                        <option>All</option>
                        <option>Open</option>
                        <option>Closed</option>
                    </select>
                </div>
            </div>
            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Channels</label>
                    <select>
                        <option>All</option>
                        {
                            channels.map(renderFilterChannelOption)
                        }
                    </select>
                </div>
            </div>
            <br />
            Hello Filter: {channels.length}
        </div>
    );
}