export default function getVideoIdFromUrl(url) {
    const { pathname, searchParams } = new URL(url);
    if (pathname.startsWith('/shorts/')) {
        const parts = pathname.split('/');
        if (parts.length > 2) {
            return parts[2];
        }
    }
    return searchParams.get('v');
}