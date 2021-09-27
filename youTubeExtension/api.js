importIntoWebsite(function () {
    const { groupBy } = window.subscriptionBox;

    class API {
        constructor(username, password, baseUrl, videoUserStateUpdateInterval) {
            this.username = username;
            this.password = password;
            this.baseUrl = baseUrl;
            this.videoUserStateUpdateInterval = videoUserStateUpdateInterval || 60;
            this.sources = new Map();
            this.videoUserStates = {};
        }

        getUpdate(value, overrideHasUpdate) {
            const hasUpdate = !!overrideHasUpdate || !!value;
            return hasUpdate ? {
                value,
                hasUpdate: true,
            } : undefined;
        }

        async init() {
            try {
                if (!this.username || !this.password || !this.baseUrl) {
                    return false
                }

                const response = await this.call({
                    url: '/api/ping',
                    method: 'GET'
                });
                return response.ok;
            } catch (e) {
                return false;
            }
        }

        call({ url, method = 'POST', body }) {
            return window.fetch(this.baseUrl + url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify({
                    username: this.username,
                    password: this.password,
                    ...body,
                }) : undefined,
            });
        }

        isVideoToUpdateUserState(videoId) {
            const userState = this.videoUserStates[videoId];
            return !userState?.timestamp || (Date.now() - userState.timestamp > this.videoUserStateUpdateInterval * 1000);
        }

        async updateUserStateOfVideos(videoIds, forceUpdate = false) {
            if (!forceUpdate) {
                videoIds = videoIds.filter(videoId => this.isVideoToUpdateUserState(videoId));
            }
            if (videoIds.length == 0) {
                return;
            }

            const response = await this.call({
                url: '/api/videos/userState',
                body: {
                    videoIds,
                }
            });

            let array = [];
            if (response.ok) {
                array = JSON.parse(await response.text());
            }

            videoIds.forEach(videoId => {
                this.videoUserStates[videoId] = {
                    videoId,
                    timestamp: Date.now(),
                    ...array.find(item => item.videoId === videoId),
                };
            });
            return videoIds;
        }

        async createChannels(channelIds) {
            try {
                let missingChannelIds = channelIds.filter(id => !this.sources.has(id));
                if (!missingChannelIds.length) {
                    return;
                }

                const fetchChannelsResponse = await this.call({
                    url: '/api/sources/fromYoutubeIds',
                    body: {
                        youTubeIds: missingChannelIds,
                    },
                });
                if (!fetchChannelsResponse.ok) {
                    return;
                }

                const fetchedChannels = JSON.parse(await fetchChannelsResponse.text());
                fetchedChannels.forEach(channel => this.sources.set(channel.youTubeId, channel));

                missingChannelIds = channelIds.filter(id => !this.sources.has(id));
                if (missingChannelIds.length) {
                    const newSources = await Promise.all(missingChannelIds.map(async channelId => {
                        const response = await this.call({
                            url: '/api/sources/add',
                            body: {
                                youTubeId: channelId,
                                isActive: false,
                            }
                        });

                        if (response.ok) {
                            return JSON.parse(await response.text());
                        }
                        return null;
                    }));

                    newSources.filter(Boolean).forEach(source => this.sources.set(source.youTubeId, source));
                }
            } catch (e) {
                console.error('createChannel error', e);
            }
        }

        async updateChannels(channels, fetchTime) {
            try {
                if (!fetchTime) {
                    fetchTime = new Date().toISOString();
                }
                const sources = Array.from(channels.keys()).map(channelId => {
                    const sourceId = this.sources.get(channelId)?.id;
                    const videos = Array.from(groupBy(channels.get(channelId), v => v.id).values()).map(g => g[0]).filter(Boolean);
                    const channelTitle = videos.map(v => v.channelTitle).find(Boolean);
                    return sourceId && {
                        id: sourceId,
                        title: this.getUpdate(channelTitle),
                        type: 3,
                        videos: videos.map(video => ({
                            id: video.id,
                            localizedTitle: this.getUpdate(video.title),
                            channelTitle: this.getUpdate(video.channelTitle),
                            channelId: this.getUpdate(video.channelId),
                            durationTicks: this.getUpdate(video.duration * 1000 * 1000 * 10),
                            state: this.getUpdate(0, true),
                            fetchTime,
                        })),
                        fetchTime,
                    }
                }).filter(Boolean);
                if (sources.length) {
                    await this.call({
                        url: '/api/sources/update',
                        method: 'PUT',
                        body: {
                            sources,
                        },
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }

        async updateThumbnails(videoIds) {
            try {
                return await this.call({
                    url: '/api/videos/updateThumbnails',
                    body: {
                        videoIds,
                    }
                });
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        updateUserVideo(videoId, isWatched) {
            return this.call({
                url: `/api/videos/userState/${videoId}`,
                method: 'PUT',
                body: {
                    isWatched,
                },
            });
        }

        updateVideoSourcesState({ videoId, sourceIds, isActive, isActiveDeprecated }) {
            return sourceIds && sourceIds.length ? this.call({
                url: `/api/videos/sourcesState/${videoId}`,
                method: 'PUT',
                body: {
                    sourceIds,
                    isActive,
                    isActiveDeprecated,
                },
            }) : Promise.resolve();
        }

        deactivateVideo(videoId, sourceIds) {
            return sourceIds && sourceIds.length ? this.call({
                url: `/api/videos/${videoId}`,
                method: 'DELETE',
                body: {
                    sourceIds,
                },
            }) : Promise.resolve();
        }
    }

    return {
        API,
    };
});