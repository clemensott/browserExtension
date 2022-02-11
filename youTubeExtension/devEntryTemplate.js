
const { js, css, port } = { /* <def> */ }; // "{ /* <def> */ }" gets replaced with the actual defintion

function getUrlFromPath(path) {
    return `http://localhost:${port}/${path}`;
}

// override to don't serve from extension file but from webpack server
chrome.runtime.getURL = getUrlFromPath;

async function runScript(url) {
    const response = await fetch(url);
    if (response.ok) {
        const script = await response.text();
        eval(script);
    } else {
        throw new Error('fetching extension script file failed');
    }
}

async function injectStyles(url) {
    const response = await fetch(url);
    if (response.ok) {
        const script = await response.text();
        const style = document.createElement('style');
        style.innerHTML = script;
        document.head.appendChild(style);
    } else {
        throw new Error('fetching extension script file failed');
    }
}

async function loadScripts() {
    try {
        await js.map(getUrlFromPath).reduce(async (promise, path) => {
            await promise;
            return runScript(path);
        }, Promise.resolve());
    } catch (err) {
        console.debug(err);
    }
}

async function loadSyles() {
    try {
        await css.map(getUrlFromPath).reduce(async (promise, path) => {
            await promise;
            return injectStyles(path);
        }, Promise.resolve());
    } catch (err) {
        console.debug(err);
    }
}

if (js) {
    loadScripts();
}

if (css) {
    loadSyles();
}
