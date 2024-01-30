import './vendors/webextension-polyfill/browser-polyfill.min.js';

const menuId = 'hideElementItem';
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== "install" && details.reason !== "update") return;
    browser.contextMenus.create({
        id: menuId,
        title: 'Hide Element',
        contexts: ['all'],
    });
});

browser.contextMenus.onClicked.addListener((e, tab, ...params) => {
    console.log('onClicked:', menuId, e, tab, params);
    if (e.menuItemId === menuId) {
        browser.tabs.sendMessage(tab.id, { type: 'show_hide_element_modal' });
    }
});

browser.runtime.onMessage.addListener(function (message, sender) {
    if (['element_infos', 'change_highlight_element', 'hide_element'].includes(message.type)) {
        browser.tabs.sendMessage(sender.tab.id, message);
    }

    return false;
});
