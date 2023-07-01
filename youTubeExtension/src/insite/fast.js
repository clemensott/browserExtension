import fetchIntersectorService from '../Services/FetchIntersectorService';

(function () {
    fetchIntersectorService.enable();
    Object.assign(window, {
        fetchIntersectorService,
    });
})();
