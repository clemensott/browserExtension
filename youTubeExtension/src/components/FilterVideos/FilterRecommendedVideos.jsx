import React, { useEffect, useState } from 'react';
import { Autocomplete, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';

const jsonValues = {
    null: JSON.stringify(null),
    true: JSON.stringify(true),
    false: JSON.stringify(false),
    channelsAll: JSON.stringify({ channelName: null, isMusicChannel: null }),
    typeVideo: JSON.stringify('video'),
    typePlaylist: JSON.stringify('playlist'),
    typeMovie: JSON.stringify('movie'),
};

function encodeValue(filter, propName) {
    const value = filter[propName];
    if (value === null || value === undefined) {
        return '';
    }
    return JSON.stringify(value);
}

function decodeValue(rawValue) {
    if (rawValue === '') {
        return null;
    }
    return JSON.parse(rawValue);
}

function useForceRerender() {
    const [value, setValue] = useState(true);
    return () => setValue(!value);
}

export default function FilterRecommendedVideos({ eventProvider, onFilterChange }) {
    const forceRerender = useForceRerender();

    useEffect(() => {
        eventProvider.addChannelsChangedEventListener(forceRerender);
        return () => {
            eventProvider.removeChannelsChangedEventListener(forceRerender);
        };
    }, [eventProvider]);

    const filter = eventProvider.getFilter();
    const channels = eventProvider.getChannels().sort((a, b) => {
        return b.count - a.count || a.channelName.localeCompare(b.channelName);
    });

    const getOnChangeHandler = (optionName) => {
        return ({ target }) => {
            onFilterChange({
                [optionName]: decodeValue(target.value),
            });
            forceRerender();
        };
    };

    return (
        <Grid container spacing={1} mb={1}>
            <Grid item xs={4}>
                <FormControl fullWidth>
                    <InputLabel id="yt-extension-filter-videos-watched-label">Watch Status</InputLabel>
                    <Select
                        id="yt-extension-filter-videos-watched"
                        labelId="yt-extension-filter-videos-watched-label"
                        value={encodeValue(filter, 'isWatched')}
                        onChange={getOnChangeHandler('isWatched')}
                        label="Watch Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value={jsonValues.true}>Watched</MenuItem>
                        <MenuItem value={jsonValues.false}>Not Watched</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={4}>
                <FormControl fullWidth>
                    <InputLabel id="yt-extension-filter-videos-active-label">Active Status</InputLabel>
                    <Select
                        id="yt-extension-filter-videos-active"
                        labelId="yt-extension-filter-videos-active-label"
                        value={encodeValue(filter, 'isActive')}
                        onChange={getOnChangeHandler('isActive')}
                        label="Active Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value={jsonValues.true}>Active</MenuItem>
                        <MenuItem value={jsonValues.false}>Inactive</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={4}>
                <FormControl fullWidth>
                    <InputLabel id="yt-extension-filter-videos-open-label">Open Status</InputLabel>
                    <Select
                        id="yt-extension-filter-videos-open"
                        labelId="yt-extension-filter-videos-open-label"
                        value={encodeValue(filter, 'isOpen')}
                        onChange={getOnChangeHandler('isOpen')}
                        label="Open Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value={jsonValues.true}>Open</MenuItem>
                        <MenuItem value={jsonValues.false}>Closed</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={8}>
                <Autocomplete
                    id="yt-extension-filter-videos-channels"
                    options={channels.map(c => ({
                        ...c,
                        label: `${c.channelName} ${c.isMusicChannel ? '♪ ' : ''}(${c.count}x)`,
                    }))}
                    renderInput={(params) => <TextField {...params} label="Channels" />}
                    onChange={(_, option) => {
                        const { channelName = null, isMusicChannel = null } = option || {};
                        onFilterChange({ channelName, isMusicChannel });
                        forceRerender();
                    }}
                    disablePortal
                />
            </Grid>

            <Grid item xs={4}>
                <FormControl fullWidth>
                    <InputLabel id="yt-extension-filter-videos-type-label">Type</InputLabel>
                    <Select
                        id="yt-extension-filter-videos-type"
                        labelId="yt-extension-filter-videos-type-label"
                        value={encodeValue(filter, 'type')}
                        onChange={getOnChangeHandler('type')}
                        label="Open Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value={jsonValues.typeVideo}>Video</MenuItem>
                        <MenuItem value={jsonValues.typePlaylist}>Playlists</MenuItem>
                        <MenuItem value={jsonValues.typeMovie}>Movie</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    label="Title"
                    value={filter.title}
                    onChange={({ target }) => {
                        onFilterChange({
                            title: target.value || null,
                        });
                        forceRerender();
                    }}
                    fullWidth
                />
            </Grid>
        </Grid>
    );
}