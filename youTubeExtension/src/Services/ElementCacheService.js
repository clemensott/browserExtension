export default class ElementCacheService {
    constructor(selectors) {
        this.cache = new Map();
        selectors.forEach(selector => {
            this.cache.set(selector.id, {
                selector: selector.selector,
            });
        });
    }

    getElement(id, callback) {
        const cacheContainer = this.cache.get(id);
        if (!cacheContainer.element || !document.body.contains(cacheContainer.element)) {
            const element = document.querySelector(cacheContainer.selector);
            const args = {
                newElement: element,
                oldElement: cacheContainer.element,
            }

            cacheContainer.element = element;

            if (typeof callback === 'function') {
                callback(args);
            }
        }
        return cacheContainer.element;
    }
}