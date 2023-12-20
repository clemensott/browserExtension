const iconStorageKey = 'ts-icon-urls';

function getURL(path) {
    return chrome.runtime.getURL('resources/icons/' + path)
}

let icons;
if (typeof chrome?.runtime?.getURL === 'function') {
    icons = {
        product: {
            black: getURL('product/black.png'),
            darkred: getURL('product/darkred.png'),
            red: getURL('product/red.png'),
            gray: getURL('product/gray.png'),
            lightblue: getURL('product/lightblue.png'),
            orange: getURL('product/orange.png'),
            blue: getURL('product/blue.png'),
        },
        delay: {
            black: getURL('delay/black.png'),
            blue: getURL('delay/blue.png'),
            gray: getURL('delay/gray.png'),
            green: getURL('delay/green.png'),
            orange: getURL('delay/orange.png'),
            purple: getURL('delay/purple.png'),
            red: getURL('delay/red.png'),
            white: getURL('delay/white.png'),
            whiteBlack: getURL('delay/white_black.png'),
            yellow: getURL('delay/yellow.png'),
        },
    };
    localStorage.setItem(iconStorageKey, JSON.stringify(icons));
}

export function getIconUrl(type, name) {
    if (!icons) {
        icons = JSON.parse(localStorage.getItem(iconStorageKey));
    }

    return icons[type][name];
}
