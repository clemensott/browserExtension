function sanitizeString(str) {
    return typeof str === 'string' ? str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        : str;
}

(function () {
    const funcCode = (function () {
        document.addEventListener('train_scraping_code_import', e => eval(e.detail));
    }).toString()

    const code = `(${funcCode})()`;
    const div = document.createElement('div');
    div.innerHTML = `<svg onload="eval(this.dataset.code)" data-code="${sanitizeString(code)}" />`;
    div.style.display = 'none';
    document.body.appendChild(div);
})();

export function importCode(code) {
    const customEvent = new CustomEvent('train_scraping_code_import', {
        detail: code,
    });
    document.dispatchEvent(customEvent);
};

export function importFunction(func, run = false) {
    const code = run ? `(${func.toString()})();` : `window.${func.name} = (${func.toString()});`;
    importCode(code);
};

