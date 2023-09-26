export default function getPlaylistIdFromUrl(url) {
    if (!url) {
        return null;
    }
    const { hostname, searchParams } = new URL(url);
    return hostname === 'www.youtube.com' && searchParams.get('list') || null;
}
