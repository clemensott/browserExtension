console.log('context Menu');

const menuId = 'hideElementItem';
self.addEventListener('install', function (e) {
    e.waitUntil(new Promise(resolve => {
        chrome.contextMenus.removeAll(function () {
            chrome.contextMenus.create({
                id: menuId,
                title: 'Hide Element',
                contexts: ['all'],
            }, resolve);
        });
    }));
});

chrome.contextMenus.onClicked.addListener((e, tab, ...params) => {
    console.log('onClicked:', menuId, e, tab, params);
    if (e.menuItemId === menuId) {
        chrome.tabs.sendMessage(tab.id, { type: 'show_hide_element_modal' });
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (['element_infos', 'change_highlight_element', 'hide_element'].includes(message.type)) {
        chrome.tabs.sendMessage(sender.tab.id, message);
        sendResponse(null);
    }
});