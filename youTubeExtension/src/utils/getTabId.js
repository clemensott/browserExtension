const key = 'tabId';

export default function getTabId() {
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = Math.random().toString();
        sessionStorage.setItem(key, Math.random());
    }

    return id;
}