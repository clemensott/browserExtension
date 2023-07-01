import InitDataService from '../Services/InitDataService';
import createApiHandler from '../utils/createApiHandler';
import StorageService from '../Services/StorageService';
import OptionsService from '../Services/OptionsService';
import SpeedMeasurer from './speedMeasure';


(async function () {
    const initDataService = new InitDataService();
    // initDataService.send('ytInitialPlayerResponse', window.ytInitialPlayerResponse);
    initDataService.send('ytInitialData', window.ytInitialData);
    window.fetchIntersectorService.enableSending();

    const optionsService = new OptionsService(new StorageService());
    await optionsService.load();

    Object.assign(window, {
        createApiHandler,
        optionsService,
        trainsSpeed: new SpeedMeasurer(),
    });
})();
