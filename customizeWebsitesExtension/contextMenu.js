chrome.extension.getBackgroundPage().console.log('context Menu');

const menuId = 'downloadLinkItem';
chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
        id: menuId,
        title: 'Download Target',
        contexts: ['link', 'selection'],
        documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
});

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

async function downloadTarget(url) {
    const response = await fetch(url);
    if (response.ok) {
        const link = document.createElement('a');
        const dataUrl = URL.createObjectURL(await response.blob());
        link.setAttribute('href', dataUrl);
        link.setAttribute('download', getFileName(url));
        link.click();
        URL.revokeObjectURL(dataUrl);
    }
}

chrome.contextMenus.onClicked.addListener(async (e, tab, ...params) => {
    chrome.extension.getBackgroundPage().console.log('onClicked:', e, tab, params);
    if (e.menuItemId === menuId) {
        const href = correctUrl(e.linkUrl || e.selectionText);
        await downloadTarget(href);
    }
});