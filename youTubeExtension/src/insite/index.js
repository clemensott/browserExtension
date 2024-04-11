import InitDataService from '../Services/InitDataService';
import createApiHandler from '../utils/createApiHandler';
import StorageService from '../Services/StorageService';
import OptionsService from '../Services/OptionsService';
import SpeedMeasurer from './speedMeasure';
import { subsribeConsentLightBoxRemove } from '../Services/Dom/ConsentLightbox';


(async function () {
    const initDataService = new InitDataService();
    // initDataService.send('ytInitialPlayerResponse', window.ytInitialPlayerResponse);
    initDataService.send('ytInitialData', window.ytInitialData);
    window.fetchIntersectorService.enableSending();

    subsribeConsentLightBoxRemove();

    const storageService = new StorageService();
    const optionsService = new OptionsService(storageService);
    await optionsService.load();

    Object.assign(window, {
        createApiHandler,
        optionsService,
        trainsSpeed: new SpeedMeasurer(),
    });
})();
