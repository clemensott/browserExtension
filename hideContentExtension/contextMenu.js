chrome.extension.getBackgroundPage().console.log('context Menu');

const menuId = 'hideElementItem';
chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
        id: menuId,
        title: 'Hide Element',
        contexts: ['all'],
    });
});

chrome.contextMenus.onClicked.addListener((e, tab, ...params) => {
    chrome.extension.getBackgroundPage().console.log('onClicked:', e, tab, params);
    if (e.menuItemId === menuId) {
        chrome.tabs.sendMessage(tab.id, { type: 'show_hide_element_modal' });
    }
});

chrome.runtime.onMessage.addListener(function (message, sender) {
    if (['element_infos', 'change_highlight_element', 'hide_element'].includes(message.type)) {
        chrome.tabs.sendMessage(sender.tab.id, message);
    }
});