import importBundle from "./insite/importBundle";
import startPlayerService from './player';
import createApiHandler from './utils/createApiHandler';
import InitDataService from './Services/InitDataService';
import UpdateSourcesService from './Services/UpdateSourcesService';
import IsUpdatingSourcesService from './Services/IsUpdatingSourcesService';
import DisplayVideoStateService from './Services/DisplayVideoStateService';

(async function () {
    startPlayerService();

    const initDataService = new InitDataService();
    const apiHandler = await createApiHandler();

    if (apiHandler) {
        console.log('API baseURL:', apiHandler.api.baseUrl);
        try {
            const updateSourcesService = new UpdateSourcesService(apiHandler);
            updateSourcesService.start();
            initDataService.addOnDataListener(({ detail }) => {
                if (detail.name === 'ytInitialData') {
                    updateSourcesService.handleData(detail.data);
                }
            });
            const isUpdatingSourcesService = new IsUpdatingSourcesService();
            isUpdatingSourcesService.start();
        } catch (err) {
            console.error('init update source service:', err);
        }

        try {
            const displayVideoStateService = new DisplayVideoStateService(apiHandler);
            displayVideoStateService.start();
        } catch (err) {
            console.error('init display video state service:', err);
        }
    }

    importBundle();
})();