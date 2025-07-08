import DomEventHandler from '../DomEventHandler';


export default class ChannelDomEventHandler extends DomEventHandler {
    constructor() {
        super({
            eventName: 'ChannelDomEventHandler.change',
            timeout: 1000,
            notFoundTimeout: 100,
        });
    }

    getElements() {
        return {
            header: document.querySelector('yt-flexible-actions-view-model'),
        };
    }

    detectChange(newObj, lastObj) {
        return DomEventHandler.detectObjectChange(
            newObj,
            lastObj,
            'header',
        );
    }
}
