(function () {
    function importFunctionIntoWebsiteInternal({ functionString, mainPropertyName, propteryName }) {
        const result = eval(`(${functionString})()`);

        if (result instanceof Promise) {
            result.then(assignResult);
        } else {
            assignResult(result);
        }

        function assignResult(res) {
            const assign = typeof propteryName === 'string' ? {
                [propteryName]: res,
            } : res;

            if (typeof assign === 'object' && assign !== null) {
                window[mainPropertyName] = Object.assign(window[mainPropertyName] || {}, assign);
            }
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