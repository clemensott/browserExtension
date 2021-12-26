import API from '../Services/API';
import ApiHandler from '../Services/ApiHandler';

export default async function createApiHandler() {
    const api = new API(
        localStorage.getItem('subscriptionBoxUsername'),
        localStorage.getItem('subscriptionBoxPassword'),
        localStorage.getItem('subscriptionBoxBaseUrl'),
    );

    const apiHandler = new ApiHandler(
        api,
        Number(localStorage.getItem('subscriptionBoxVideoUserStateUpdateInterval')),
    );

    if (await apiHandler.init()) {
        return apiHandler;
    }

    console.warn('API init error. You may need to update credentials:\n' +
        'localStorage.setItem("subscriptionBoxUsername", "");\n' +
        'localStorage.setItem("subscriptionBoxPassword", "");\n' +
        'localStorage.setItem("subscriptionBoxBaseUrl", "");');
    return null;
}