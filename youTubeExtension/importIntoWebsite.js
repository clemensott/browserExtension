(function () {
    async function importFunctionIntoWebsiteInternal({ functionString, mainPropertyName, propteryName }) {
        try {
            if (!window[mainPropertyName]) {
                window[mainPropertyName] = {};
            }

            const res = await eval(`(${functionString})(window[${JSON.stringify(mainPropertyName)}])`);
            const assign = typeof propteryName === 'string' ? {
                [propteryName]: res,
            } : res;

            if (assign && typeof assign === 'object') {
                window[mainPropertyName] = Object.assign(window[mainPropertyName] || {}, assign);
            }
        } catch (err) {
            console.error('import function:', err);
        }
    }

    const script = document.createElement('script');
    script.innerText = `eval(${JSON.stringify(importFunctionIntoWebsiteInternal.toString())})`;
    document.body.appendChild(script);
})();

function importIntoWebsite(func, { mainPropertyName = 'subscriptionBox', propteryName } = {}) {
    const parameterObject = {
        functionString: func.toString(),
        mainPropertyName,
        propteryName,
    };

    const script = document.createElement('script');
    script.innerText = `importFunctionIntoWebsiteInternal(${JSON.stringify(parameterObject)});`;
    document.body.appendChild(script);
}