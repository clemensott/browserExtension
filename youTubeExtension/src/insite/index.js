import InitDataService from '../Services/InitDataService';
import fetchIntersectorService from '../Services/FetchIntersectorService';
import createApiHandler from '../utils/createApiHandler';
import StorageService from '../Services/StorageService';
import OptionsService from '../Services/OptionsService';

(function () {
    console.log('youtube extension insite js');

    const initDataService = new InitDataService();
    initDataService.send('ytInitialData', ytInitialData);
    fetchIntersectorService.enable();

    const optionsService = new OptionsService(new StorageService());
    optionsService.load();

    Object.assign(window, {
        createApiHandler,
        optionsService,
    });
})();
