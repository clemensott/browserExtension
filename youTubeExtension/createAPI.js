importIntoWebsite(function () {
    const { Mutex, API } = window.subscriptionBox;
    let api = null;

    const createApiMutex = new Mutex(async function () {
        if (!api) {
            const tmp = new API(
                localStorage.getItem('subscriptionBoxUsername'),
                localStorage.getItem('subscriptionBoxPassword'),
                localStorage.getItem('subscriptionBoxBaseUrl'),
                Number(localStorage.getItem('subscriptionBoxVideoUserStateUpdateInterval')),
            );

            if (!await tmp.init()) {
                console.warn('API init error. You may need to update credentials:\n' +
                    'localStorage.setItem("subscriptionBoxUsername", "");\n' +
                    'localStorage.setItem("subscriptionBoxPassword", "");\n' +
                    'localStorage.setItem("subscriptionBoxBaseUrl", "");');
                return null;
            }
            api = tmp;
        }

        return api;
    });

    return {
        createAPI: function () {
            return createApiMutex.run();
        },
    };
});