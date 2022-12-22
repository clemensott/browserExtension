import groupBy from '../utils/groupBy';
import triggerEvent from '../utils/triggerEvent';

const constants = {
    UPDATE_USER_STATE_OF_VIDEOS: 'ApiHandler.updateUserStateOfVideos',
};

export default class ApiHandler {
    constructor(api, videoUserStateUpdateInterval) {
        this.api = api;
        this.videoUserStateUpdateInterval = videoUserStateUpdateInterval || 60;
        this.channels = new Map();
        this.sources = new Map();
        this.videoUserStates = new Map();
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

    getVideoUserState(videoId) {
        return this.videoUserStates.get(videoId);
    }

    getVideoUserStateWithSourcesData(videoId) {
        const videoUserState = this.videoUserStates.get(videoId);
        return videoUserState ? {
            ...videoUserState,
            sources: videoUserState.sources && videoUserState.sources.map(source => ({
                ...source,
                data: this.getSourceFromId(source.sourceId),
            })),
        } : null;
    }

    setVideoUserState(videoUserState) {
        return this.videoUserStates.set(videoUserState.videoId, videoUserState);
    }

    isVideoToUpdateUserState(videoId) {
        const userState = this.getVideoUserState(videoId);
        return !userState?.timestamp || (Date.now() - userState.timestamp > this.videoUserStateUpdateInterval * 1000);
    }

    async updateUserStateOfVideos(videoIds, forceUpdate = false) {
        if (!forceUpdate) {
            videoIds = videoIds.filter(videoId => this.isVideoToUpdateUserState(videoId));
        }
        if (videoIds.length == 0) {
            return;
        }

        const response = new Map();
        try {
            const array = await this.api.videoUserState(videoIds);
            array.forEach(item => response.set(item.videoId, item))
        } catch { }

        videoIds.forEach(videoId => {
            this.setVideoUserState({
                ...this.getVideoUserState(videoId),
                ...response.get(videoId),
                videoId,
                timestamp: Date.now(),
            });
        });
        triggerEvent(constants.UPDATE_USER_STATE_OF_VIDEOS, {
            videoIds: new Set(videoIds),
        });
        return videoIds;
    }

    addUpdateUserStateOfVideosEventListener(callback) {
        document.addEventListener(constants.UPDATE_USER_STATE_OF_VIDEOS, callback);
    }

    removeUpdateUserStateOfVideosEventListener(callback) {
        document.removeEventListener(constants.UPDATE_USER_STATE_OF_VIDEOS, callback);
    }

    async createChannels(channelIds) {
        try {
            let missingChannelIds = channelIds.filter(id => !this.channels.has(id));
            if (!missingChannelIds.length) {
                return;
            }

            const fetchedChannels = await this.api.sourceFromYoutubeIds(missingChannelIds);
            fetchedChannels.forEach(channel => this.setSource(channel));

            missingChannelIds = channelIds.filter(id => !this.channels.has(id));
            await Promise.all(missingChannelIds.map(async channelId => {
                try {
                    const source = await this.api.sourceAdd(channelId, false);
                    this.setSource(source);
                } catch (e) {
                    console.log('create source error:', e)
                }
            }));
        } catch (e) {
            console.error('createChannel error', e);
        }
    }

    getStatisticsUpdate(video) {
        const statistics = {
            views: video.views,
            likes: video.likes,
            dislikes: video.dislikes,
            comments: video.comments,
        };

        return this.getUpdate(statistics, Object.values(statistics).some(value => typeof value === 'number'));
    }

    async updateChannels(channels, fetchTime) {
        try {
            if (!fetchTime) {
                fetchTime = new Date().toISOString();
            }
            const sources = Array.from(channels.keys()).map(channelId => {
                const sourceId = this.channels.get(channelId)?.id;
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
                        statistics: this.getStatisticsUpdate(video),
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

    async loadSources(sourceIds) {
        try {
            const missingSourceIds = sourceIds.filter(id => !this.sources.has(id));
            if (missingSourceIds.length) {
                const fetchedSources = await this.api.sourceList(missingSourceIds);
                fetchedSources.forEach(source => this.setSource(source));
            }
        } catch (e) {
            console.error('loadSources error', e);
        }
    }

    setSource(source) {
        this.sources.set(source.id, source);
        if (source.youTubeId) {
            this.channels.set(source.youTubeId, source);
        }
    }

    getSourceFromId(sourceId) {
        return this.sources.get(sourceId);
    }

    getSourceFromYouTubeId(youtubeId) {
        return this.channels.get(youtubeId);
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
