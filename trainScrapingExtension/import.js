function sanitizeString(str) {
    return typeof str === 'string' ? str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        : str;
}

(function () {
    function createImportListener() {
        const channel = new BroadcastChannel('train_scraping_code_importer');
        channel.addEventListener('message', e => {
            eval(e.data);
        });
        console.log('set up listener');
    }

    const code = `(${createImportListener.toString()})()`;
    const div = document.createElement('div');
    div.innerHTML = `<svg onload="eval(this.dataset.code)" data-code="${sanitizeString(code)}" />`;
    div.style.display = 'none';
    document.body.appendChild(div);
})();

const channel = new BroadcastChannel('train_scraping_code_importer');

const importCode = (code) => {
    channel.postMessage(code);
};

const importFunction = (func, run = false) => {
    const code = run ? `(${func.toString()})();` : `window.${func.name} = (${func.toString()});`;
    importCode(code);
};

window.addEventListener('load', () => {
    importCode(`window.dnySample = ${JSON.stringify(window.dnySample)};`);
    importFunction(utils, true);
    importFunction(Api);
    importFunction(DnyLoader);
    importFunction(DnyRenderer);
    importFunction(main, true);
});
