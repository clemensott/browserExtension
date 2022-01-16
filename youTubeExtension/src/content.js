import importBundle from "./insite/importBundle";
import startPlayerService from './player';
import ChannelHelperService from './Services/ChannelHelperService';
import createApiHandler from './utils/createApiHandler';
import InitDataService from './Services/InitDataService';
import UpdateSourcesService from './Services/UpdateSourcesService';
import IsUpdatingSourcesService from './Services/IsUpdatingSourcesService';
import DisplayVideoStateService from './Services/DisplayVideoStateService';
import ChannelVideoHidingService from './Services/ChannelVideoHidingService';
import DomEventService from './Services/DomEventService';
import NavigationEventService from "./Services/NavigationEventService";

(async function () {
    startPlayerService();

    const navigationService = new NavigationEventService();
    const domService = new DomEventService({ navigationService });
    const channelVideoHidingService = new ChannelVideoHidingService();
    const channelHelperService = new ChannelHelperService({
        channelVideoHidingService,
        domService,
    });
    const isUpdatingSourcesService = new IsUpdatingSourcesService({ domService });

    const initDataService = new InitDataService();
    const apiHandler = await createApiHandler();

    if (apiHandler) {
        navigationService.start();
        domService.start();
        channelHelperService.start();

        console.log('API baseURL:', apiHandler.api.baseUrl);
        try {
            isUpdatingSourcesService.start();
            const updateSourcesService = new UpdateSourcesService(apiHandler);
            updateSourcesService.start();
            initDataService.addOnDataListener(({ detail }) => {
                if (detail.name === 'ytInitialData') {
                    updateSourcesService.handleData(detail.data);
                }
            });
        } catch (err) {
            console.error('init update source service:', err);
        }

        try {
            const displayVideoStateService = new DisplayVideoStateService(apiHandler);
            displayVideoStateService.start();
        } catch (err) {
            console.error('init display video state service:', err);
        }

        importBundle();
    }
})();