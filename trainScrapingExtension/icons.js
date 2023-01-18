async function loadDataURL(path) {
    const url = chrome.runtime.getURL(path);
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise(resolve => {
        reader.addEventListener('loadend', () => resolve(reader.result));
        reader.readAsDataURL(blob);
    });
}

async function getIconsCode() {
    const iconURLs = {
        "default": await loadDataURL('resources/prod_00.png'),
        "1": await loadDataURL('resources/prod_01.png'),
        "4": await loadDataURL('resources/prod_04.png'),
        "8": await loadDataURL('resources/prod_08.png'),
        "16": await loadDataURL('resources/prod_16.png'),
        "32": await loadDataURL('resources/prod_32.png'),
    };
    return `window.trainScrapingIconURLs = ${JSON.stringify(iconURLs)}`;
}
