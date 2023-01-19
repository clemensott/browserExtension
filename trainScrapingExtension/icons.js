async function loadData(path) {
    const url = chrome.runtime.getURL(path);
    const response = await fetch(url);
    const type = response.headers.get('content-type');
    const reader = response.body.getReader();

    let data = [];
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        data = data.concat([...value]);
    }

    return {
        data,
        type,
    };
}

function setIconUrls(iconData) {
    window.trainScrapingIconURLs = Object.entries(iconData).reduce((sum, [key, { data, type }]) => {
        const array = new Uint8Array(data);
        const blob = new Blob([array], { type });
        sum[key] = window.URL.createObjectURL(blob);
        return sum;
    }, {});
}

async function getIconsCode() {
    const iconURLs = {
        "default": await loadData('resources/prod_00.png'),
        "1": await loadData('resources/prod_01.png'),
        "4": await loadData('resources/prod_04.png'),
        "8": await loadData('resources/prod_08.png'),
        "16": await loadData('resources/prod_16.png'),
        "32": await loadData('resources/prod_32.png'),
    };
    return `(${setIconUrls.toString()})(${JSON.stringify(iconURLs)});`;
}
