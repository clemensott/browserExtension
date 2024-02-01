export const iconStorageKey = 'ts-icon-urls';

let icons;
export function getIconUrl(type, name) {
    if (!icons) {
        icons = JSON.parse(localStorage.getItem(iconStorageKey));
    }

    return icons[type][name];
}
