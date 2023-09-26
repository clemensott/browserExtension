export default function getVideoIdFromUrl(url) {
    if (!url) {
        return null;
    }
    const { hostname, pathname, searchParams } = new URL(url);
    switch (hostname) {
        case 'www.youtube.com':
            if (pathname.startsWith('/shorts/')) {
                const parts = pathname.split('/');
                if (parts.length > 2) {
                    return parts[2] || null;
                }
            }
            return searchParams.get('v') || null;
        case 'youtu.be':
            return pathname.split('/')[1] || null;
    }
    return null;
}
