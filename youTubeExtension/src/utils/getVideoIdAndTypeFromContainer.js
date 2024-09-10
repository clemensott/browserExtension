export default function getVideoIdAndTypeFromContainer(container) {
    const a = container.querySelector('a#thumbnail,a.reel-item-endpoint');
    if (!a) {
        return {
            videoId: null,
            type: null,
        };
    }

    const { pathname, searchParams } = new URL(a.href);
    if (pathname.startsWith('/shorts/')) {
        const parts = pathname.split('/');
        if (parts.length > 2) {
            return {
                videoId: parts[2],
                type: 'short',
            };
        }
    }

    let type;
    switch (container.tagName.toLowerCase()) {
        case 'ytd-compact-video-renderer':
        case 'ytd-rich-item-renderer':
        case 'ytd-grid-video-renderer':
        case 'ytd-playlist-panel-video-renderer':
        case 'ytd-playlist-video-renderer':
        case 'ytd-video-renderer':
            type = 'video';
            break;
        case 'ytd-compact-playlist-renderer':
            type = 'playlist';
            break;
        case 'ytd-compact-movie-renderer':
            type = 'movie';
            break;
        case 'ytd-reel-item-renderer':
            type = 'short';
            break;
        default:
            console.warn('TagName not supported:', container.tagName);
            type = null;
    }
    return {
        videoId: searchParams.get('v'),
        type,
    };
}
