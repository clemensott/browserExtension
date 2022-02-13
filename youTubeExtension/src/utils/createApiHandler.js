import API from '../Services/API';
import ApiHandler from '../Services/ApiHandler';

export default async function createApiHandler(options) {
    const api = new API(
        options.apiUsername,
        options.apiPassword,
        options.apiBaseUrl,
    );

    const apiHandler = new ApiHandler(
        api,
        Number(options.videoUserStateUpdateInterval),
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