importIntoWebsite(function ({ groupBy }) {
    class ApiHandler {
        constructor(api, videoUserStateUpdateInterval) {
            this.api = api;
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
                if (!this.api.username || !this.api.password || !this.api.baseUrl) {
                    return false
                }

                return await this.api.ping();
            } catch (e) {
                return false;
            }
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

            let response = new Map();
            try {
                const array = await this.api.videoUserState(videoIds);
                array.forEach(item => response.set(item.videoId, item))
            } catch { }

            videoIds.forEach(videoId => {
                this.videoUserStates[videoId] = {
                    ...this.videoUserStates[videoId],
                    ...response.get(videoId),
                    videoId,
                    timestamp: Date.now(),
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

                const fetchedChannels = await this.api.sourceFromYoutubeIds(missingChannelIds);
                fetchedChannels.forEach(channel => this.sources.set(channel.youTubeId, channel));

                missingChannelIds = channelIds.filter(id => !this.sources.has(id));
                await Promise.all(missingChannelIds.map(async channelId => {
                    try {
                        const source = await this.api.sourceAdd(channelId, false);
                        this.sources.set(source.youTubeId, source)
                    } catch (e) {
                        console.log('create source error:', e)
                    }
                }));
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
                    await this.api.sourceUpdate(sources);
                }
            } catch (e) {
                console.error('update channels:', e);
            }
        }

        async updateThumbnails(videoIds) {
            try {
                return await this.api.videoUpdateThumbnails(videoIds);
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        async updateUserVideo(videoId, isWatched) {
            try {
                return await this.api.putVideoUserState(videoId, isWatched);
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        async updateVideoSourcesState({ videoId, sourceIds, isActive, isActiveDeprecated }) {
            try {
                return sourceIds && sourceIds.length ?
                    await this.api.putVideoSourceState(videoId, sourceIds, isActive, isActiveDeprecated) :
                    null;
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        async deactivateVideo(videoId, sourceIds) {
            try {
                return sourceIds && sourceIds.length ?
                    await this.api.deleteVideo(videoId, sourceIds) :
                    null;
            } catch (e) {
                console.error(e);
                return null;
            }
        }
    }

    return {
        ApiHandler,
    };
});