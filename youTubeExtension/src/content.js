import importBundle from './insite/importBundle';
import setupPlayerService from './player';
import ChannelHelperService from './Services/Dom/Channel/ChannelHelperService';
import createApiHandler from './utils/createApiHandler';
import InitDataService from './Services/InitDataService';
import UpdateSourcesService from './Services/UpdateSources/UpdateSourcesService';
import IsUpdatingSourcesService from './Services/Dom/IsUpdatingSourcesService';
import VideoOverlayService from './Services/Dom/VideoOverlay/VideoOverlayService';
import ChannelVideoHidingService from './Services/Dom/Channel/ChannelVideoHidingService';
import DomEventService from './Services/Dom/DomEventService';
import NavigationEventService from './Services/NavigationEventService';
import UpdateSourcesTrackerService from './Services/UpdateSourcesTrackerService';
import checkExclusivity from './utils/checkExclusivity';
import StorageService from './Services/StorageService';
import OptionsService from './Services/OptionsService';
import VideoOpenStorageService from './Services/VideoOpenStorageService';

async function main() {
    const optionsService = new OptionsService(new StorageService());
    await optionsService.load();

    setupPlayerService(optionsService);

    const updateSourcesTrackerService = new UpdateSourcesTrackerService();
    const navigationService = new NavigationEventService();
    const domService = new DomEventService({ optionsService, navigationService, updateSourcesTrackerService });
    const channelVideoHidingService = new ChannelVideoHidingService({ domService, updateSourcesTrackerService });
    const channelHelperService = new ChannelHelperService({
        channelVideoHidingService,
        domService,
    });
    const isUpdatingSourcesService = new IsUpdatingSourcesService({
        domService,
        trackerService: updateSourcesTrackerService,
    });
    const videoOpenStorageService = new VideoOpenStorageService(navigationService);

    const initDataService = new InitDataService();
    const apiHandler = await createApiHandler(optionsService);

    if (optionsService.isDomManipulationEnabled) {
        channelHelperService.init();
        channelVideoHidingService.init();
        domService.start();
        navigationService.start();
        updateSourcesTrackerService.init();
        videoOpenStorageService.start();
        window.videoOpenStorage = videoOpenStorageService;
    }

    if (apiHandler) {
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
            const displayVideoStateService = new VideoOverlayService(apiHandler, videoOpenStorageService);
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
