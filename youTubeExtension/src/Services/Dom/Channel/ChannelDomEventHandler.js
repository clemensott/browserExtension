import DomEventHandler from '../DomEventHandler';


export default class ChannelDomEventHandler extends DomEventHandler {
    constructor() {
        super({
            eventName: 'ChannelDomEventHandler.change',
            elementsGetter: ChannelDomEventHandler.getChannelHeader,
            timeout: 1000,
            notFoundTimeout: 100,
        });
    }

    static getChannelHeader() {
        return document.querySelector('#channel-container');
    }
}
