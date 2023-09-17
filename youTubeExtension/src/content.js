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
import FilterRecommendedVideosService from './Services/Dom/FilterVideos/FilterRecommendedVideosService';
import FetchIntersectorService from './Services/FetchIntersectorService';
import MessagesService from './Services/MessagesService';

async function main() {
    const optionsService = new OptionsService(new StorageService());
    await optionsService.load();

    setupPlayerService(optionsService);

    const updateSourcesTrackerService = new UpdateSourcesTrackerService();
    const navigationService = new NavigationEventService();
    const messagesService = new MessagesService();
    const videoOpenStorageService = new VideoOpenStorageService(navigationService, messagesService);
    const filterRecommendedVideosService = new FilterRecommendedVideosService({ videoOpenStorageService });
    const domService = new DomEventService({
        optionsService,
        navigationService,
        updateSourcesTrackerService,
        filterRecommendedVideosService,
    });
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

        filterRecommendedVideosService.setApiHandler(apiHandler);

        try {
            isUpdatingSourcesService.start();
            const updateSourcesService = new UpdateSourcesService(apiHandler);
            updateSourcesService.start();
            initDataService.addOnDataListener(({ detail }) => {
                if (['ytInitialData', 'ytInitialPlayerResponse'].includes(detail.name)) {
                    updateSourcesService.handleData(detail.data);
                }
            });
        } catch (err) {
            console.error('init update source service:', err);
        }

        try {
            const videoOverlayService = new VideoOverlayService({
                api: apiHandler,
                videoOpenStorageService,
            });
            videoOverlayService.start();
        } catch (err) {
            console.error('init display video state service:', err);
        }

        importBundle('insite.js');
    } else {
        FetchIntersectorService.disable();
    }
}

if (checkExclusivity()) {
    main();
}
