import InitDataService from '../Services/InitDataService';
import fetchIntersectorService from '../Services/FetchIntersectorService';
import channelVideoHiding from './channelVideoHiding';
import createApiHandler from '../utils/createApiHandler';

(function () {
    console.log('youtube extension insite js');

    const initDataService = new InitDataService();
    initDataService.send('ytInitialData', ytInitialData);
    fetchIntersectorService.enable();

    Object.assign(window, {
        channelVideoHiding,
        createApiHandler,
    });
})();
