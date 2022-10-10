const key = 'tabId';
sessionStorage.setItem(key, Math.random());

export default function getTabId() {
    return sessionStorage.getItem(key);
}