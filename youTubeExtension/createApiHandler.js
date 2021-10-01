importIntoWebsite(function () {
    const { Mutex, API, ApiHandler } = window.subscriptionBox;
    let apiHandler = null;

    const createApiMutex = new Mutex(async function () {
        if (!apiHandler) {
            const api = new API(
                localStorage.getItem('subscriptionBoxUsername'),
                localStorage.getItem('subscriptionBoxPassword'),
                localStorage.getItem('subscriptionBoxBaseUrl'),
            );

            const tmp = new ApiHandler(
                api,
                Number(localStorage.getItem('subscriptionBoxVideoUserStateUpdateInterval')),
            );

            if (!await tmp.init()) {
                console.warn('API init error. You may need to update credentials:\n' +
                    'localStorage.setItem("subscriptionBoxUsername", "");\n' +
                    'localStorage.setItem("subscriptionBoxPassword", "");\n' +
                    'localStorage.setItem("subscriptionBoxBaseUrl", "");');
                return null;
            }
            apiHandler = tmp;
        }

        return apiHandler;
    });

    return {
        createAPI: function () {
            return createApiMutex.run();
        },
    };
});