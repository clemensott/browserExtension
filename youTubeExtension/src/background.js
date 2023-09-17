import MessagesService from './Services/MessagesService';
import getVideoIdFromUrl from './utils/getVideoIdFromUrl';

self.addEventListener('install', function () {
    async function getDiscardedVideoIds() {
        const youtubeTabs = await chrome.tabs.query({
            discarded: true,
            url: 'https://www.youtube.com/*',
        });

        return youtubeTabs.map(t => getVideoIdFromUrl(t.url)).filter(Boolean);
    }

    function getUrlsFromBookmarkTreeNodes(nodes) {
        const urls = [];
        nodes.forEach(node => {
            if (node.url) {
                urls.push(node.url);
            }
            if (node.children) {
                urls.push(...getUrlsFromBookmarkTreeNodes(node.children));
            }
        });
        return urls;
    }

    async function getBookmarkVideoIds() {
        const tree = await chrome.bookmarks.getTree();
        const allUrls = getUrlsFromBookmarkTreeNodes(tree);
        return allUrls.filter(url => url.startsWith('https://www.youtube.com/') || url.startsWith('https://youtu.be/'))
            .map(getVideoIdFromUrl)
            .filter(Boolean);
    }

    async function getOpenYoutubeTabIds() {
        const openTabs = await chrome.tabs.query({
            discarded: false,
            url: 'https://www.youtube.com/*',
        });

        return openTabs.map(t => t.id);
    }

    const messagesService = new MessagesService();

    messagesService.onRequestOpenVideos(async () => ({
        discardedVideoIds: await getDiscardedVideoIds(),
        bookmarkVideoIds: await getBookmarkVideoIds(),
    }));

    chrome.tabs.onUpdated.addListener(async (_, { discarded, url }, tab) => {
        if (typeof discarded === 'boolean' || typeof url === 'string') {
            const discardedVideoIds = await getDiscardedVideoIds();
            const openTabIds = await getOpenYoutubeTabIds();
            messagesService.sendDiscardedOpenVideos(openTabIds, { discardedVideoIds });
        }
    });

    async function onBookmarkChanged() {
        const bookmarkVideoIds = await getBookmarkVideoIds();
        const openTabIds = await getOpenYoutubeTabIds();
        messagesService.sendBookmarkOpenVideos(openTabIds, { bookmarkVideoIds });
    }

    chrome.bookmarks.onCreated.addListener(onBookmarkChanged);
    chrome.bookmarks.onChanged.addListener(onBookmarkChanged);
    chrome.bookmarks.onRemoved.addListener(onBookmarkChanged);
});
