import getTabId from '../../utils/getTabId';
import groupBy from '../../utils/groupBy';
import fetchIntersectorService from '../FetchIntersectorService';
import watchVideoDataHandler from './WatchVideoDataHandler';
import watchVideoDetailsDataHandler from './WatchVideoDetailsDataHandler';
import shortsWatchDataHandler from './ShortsWatchDataHandler';
import recommendationVideosDataHandler from './RecommendationVideosDataHandler';
import watchPlaylistVideosDataHandler from './WatchPlaylistVideosDataHandler';
import channelVideosDataHandler from './ChannelVideosDataHandler';
import subBoxVideosDataHandler from './SubBoxVideosDataHandler';
import searchPrimaryVideosDataHandler from './SearchPrimaryVideosDataHandler';
import searchSecondaryVideosDataHandler from './SearchSecondaryVideosDataHandler';
import playlistVideosDataHandler from './PlaylistVideosDataHandler';
import homeDataHandler from './HomeDataHandler';


const handlers = [
    watchVideoDataHandler,
    watchVideoDetailsDataHandler,
    shortsWatchDataHandler,
    recommendationVideosDataHandler,
    watchPlaylistVideosDataHandler,
    channelVideosDataHandler,
    subBoxVideosDataHandler,
    searchPrimaryVideosDataHandler,
    searchSecondaryVideosDataHandler,
    playlistVideosDataHandler,
    homeDataHandler,
];

export default class UpdateSourcesService {
    constructor(api) {
        this.api = api;
        this.broadcast = new BroadcastChannel('updateSources');
        this.channels = new Map();
        this.onFetchText = this.onFetchText.bind(this);
    }

    broadcastMessage(type, data) {
        this.broadcast.postMessage({
            tabId: getTabId(),
            type,
            ...data,
        });
    }

    async handleVideosUpdates(videos, fetchTime) {
        if (videos && videos.length) {
            console.log('handleVideosUpdates1:', videos.length, fetchTime);

            try {
                this.broadcastMessage('startHandleVideos', { videos });

                const channels = groupBy(videos, video => video.channelId);
                await this.api.createChannels(Array.from(channels.keys()));
                await this.api.updateChannels(channels, fetchTime);
            } finally {
                this.broadcastMessage('endHandleVideos', { videos });
            }
        }
    }

    async handleThumbnailsUpdate(videoIds) {
        if (videoIds && videoIds.length) {
            this.broadcastMessage('startUpdateThumbnails', { videoIds });
            const distinctVideoIds = Array.from(new Set(videoIds));
            await this.api.updateThumbnails(distinctVideoIds);
            this.broadcastMessage('endUpdateThumbnails', { videoIds });
        }
    }

    async handleData(data) {
        const fetchTime = new Date().toISOString();
        const thumbnailUpdatePromises = [];

        const updateThumbnails = videos => {
            const visibleVideos = videos.filter(v => {
                const source = this.api.getSourceFromYouTubeId(v.channelId);
                return source && source.isActive && source.visibleVideos.includes(v.id);
            });
            thumbnailUpdatePromises.push(this.handleThumbnailsUpdate(visibleVideos.map(v => v.id)));
        }

        await handlers.reduce(async (promise, handler) => {
            await promise;
            const videos = handler.extractVideos(data);
            if (videos && videos.length) {
                console.log('handle videos:', handler.name, videos.length, videos);
                await this.handleVideosUpdates(videos, fetchTime);
                updateThumbnails(videos);
            }
        }, Promise.resolve());

        await Promise.all(thumbnailUpdatePromises);
    }

    async onFetchText({ detail: { url, text, json } }) {
        if ([
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/search',
            'https://www.youtube.com/youtubei/v1/reel/reel_item_watch',
        ].some(u => url.startsWith(u))) {
            try {
                await this.handleData(json || JSON.parse(text));
            } catch (e) {
                console.error(e)
            }
        }
    }

    start() {
        fetchIntersectorService.addOnTextListener(this.onFetchText);
    }
}