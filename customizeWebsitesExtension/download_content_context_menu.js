import './vendors/webextension-polyfill/browser-polyfill.min.js';

const menuId = 'downloadLinkItem';
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== "install" && details.reason !== "update") return;
    browser.contextMenus.create({
        id: menuId,
        title: 'Download Target',
        contexts: ['link', 'selection'],
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
});

browser.contextMenus.onClicked.addListener(async (e, tab, ...params) => {
    function correctUrl(url) {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            return url;
        }

        let index = url.indexOf('s://');
        if (index > 0 && index < 4) {
            return `http${url.substring(index)}`;
        }

        index = url.indexOf('p://');
        if (index > 0 && index < 3) {
            return `htt${url.substring(index)}`;
        }

        return url;
    }

    function getFileName(url) {
        const { pathname } = new URL(url);
        const parts = pathname.split('/').filter(Boolean);
        return parts[parts.length - 1];
    }

    console.log('onClicked:', e, tab, params);
    if (e.menuItemId === menuId) {
        const downloadId = `${Date.now()}-${Math.random()}`;
        const href = correctUrl(e.linkUrl || e.selectionText);

        const response = await fetch(href);
        const size = response.headers.get('content-length');
        if (size && size > 4 * 1024 * 1024) {
            browser.tabs.sendMessage(tab.id, {
                type: 'download_url_content_size',
                size,
                fileName: getFileName(href),
            });
        }

        browser.tabs.sendMessage(tab.id, {
            type: 'download_url_content_start',
            downloadId,
            fileName: getFileName(href),
            contentType: response.headers.get('content-type'),
        });

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();

            browser.tabs.sendMessage(tab.id, {
                type: 'download_url_content_data',
                downloadId,
                data: value,
                fileName: getFileName(href),
                finished: !!done,
            });

            if (done) {
                break;
            }
        }
    }
});
