import React, { useEffect, useState } from 'react';
import './FilterRecommendedVideos.css';

const jsonValues = {
    null: JSON.stringify(null),
    true: JSON.stringify(true),
    false: JSON.stringify(false),
    channelsAll: JSON.stringify({ channelName: null, isMusic: null }),
    typeVideo: JSON.stringify('video'),
    typePlaylist: JSON.stringify('playlist'),
    typeMovie: JSON.stringify('movie'),
};

function renderFilterChannelOption({ channelName, isMusic, count }) {
    return (
        <option key={channelName} value={JSON.stringify({ channelName, isMusic })}>
            {channelName} {isMusic ? '♪ ' : ''}({count}x)
        </option>
    );
}

export default function FilterRecommendedVideos({ defaultFilter, eventProvider, onFilterChange }) {
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
                    <select
                        defaultValue={JSON.stringify(defaultFilter.isWatchted)}
                        onChange={getOnChangeHandler('isWatchted')}
                    >
                        <option value={jsonValues.null}>All</option>
                        <option value={jsonValues.true}>Watched</option>
                        <option value={jsonValues.false}>Not Watched</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Active Status</label>
                    <select
                        defaultValue={JSON.stringify(defaultFilter.isWatchted)}
                        onChange={getOnChangeHandler('isActive')}
                    >
                        <option value={jsonValues.null}>All</option>
                        <option value={jsonValues.true}>Active</option>
                        <option value={jsonValues.false}>Inactive</option>
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Open Status</label>
                    <select
                        defaultValue={JSON.stringify(defaultFilter.isWatchted)}
                        onChange={getOnChangeHandler('isOpen')}
                    >
                        <option value={jsonValues.null}>All</option>
                        <option value={jsonValues.true}>Open</option>
                        <option value={jsonValues.false}>Closed</option>
                    </select>
                </div>
            </div>

            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Channels</label>
                    <select
                        defaultValue={JSON.stringify({
                            channelName: defaultFilter.channelName,
                            isMusic: defaultFilter.isMusic,
                        })}
                        style={{ width: '100%' }}
                        onChange={({ target }) => onFilterChange(
                            JSON.parse(target.value),
                        )}
                    >
                        <option value={jsonValues.channelsAll}>
                            All
                        </option>
                        {channels.map(renderFilterChannelOption)}
                    </select>
                </div>

                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Type</label>
                    <select
                        defaultValue={defaultFilter.type}
                        onChange={getOnChangeHandler('type')}
                    >
                        <option value={jsonValues.null}>All</option>
                        <option value={jsonValues.typeVideo}>Video</option>
                        <option value={jsonValues.typePlaylist}>Playlists</option>
                        <option value={jsonValues.typeMovie}>Movie</option>
                    </select>
                </div>
            </div>

            <div className="yt-extension-filter-videos-row-contianer">
                <div className="yt-extension-filter-videos-select-contianer">
                    <label>Title</label>
                    <input
                        type="text"
                        defaultValue={defaultFilter.title}
                        onChange={({ target }) => onFilterChange({
                            title: target.value || null,
                        })}
                    />
                </div>
            </div>
        </div>
    );
}