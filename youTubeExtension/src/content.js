import importBundle from './insite/importBundle';
import startPlayerService from './player';
import ChannelHelperService from './Services/Dom/Channel/ChannelHelperService';
import createApiHandler from './utils/createApiHandler';
import InitDataService from './Services/InitDataService';
import UpdateSourcesService from './Services/UpdateSourcesService';
import IsUpdatingSourcesService from './Services/Dom/IsUpdatingSourcesService';
import DisplayVideoStateService from './Services/Dom/DisplayVideoStateService';
import ChannelVideoHidingService from './Services/Dom/Channel/ChannelVideoHidingService';
import DomEventService from './Services/Dom/DomEventService';
import NavigationEventService from './Services/NavigationEventService';
import UpdateSourcesTrackerService from './Services/UpdateSourcesTrackerService';
import checkExclusivity from './utils/checkExclusivity';
import StorageService from './Services/StorageService';
import OptionsService from './Services/OptionsService';


async function main() {
    const optionsService = new OptionsService(new StorageService());
    await optionsService.load();

    startPlayerService(optionsService);

    const updateSourcesTrackerService = new UpdateSourcesTrackerService();
    const navigationService = new NavigationEventService();
    const domService = new DomEventService({ navigationService, updateSourcesTrackerService });
    const channelVideoHidingService = new ChannelVideoHidingService({ domService, updateSourcesTrackerService });
    const channelHelperService = new ChannelHelperService({
        channelVideoHidingService,
        domService,
    });
    const isUpdatingSourcesService = new IsUpdatingSourcesService({
        domService,
        trackerService: updateSourcesTrackerService,
    });

    const initDataService = new InitDataService();
    const apiHandler = await createApiHandler(optionsService);

    if (apiHandler) {
        channelHelperService.init();
        channelVideoHidingService.init();
        domService.start();
        navigationService.start();
        updateSourcesTrackerService.init();

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
}

if (checkExclusivity()) {
    main();
}
