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
        const header = document.querySelector('#channel-container');
        return {
            header,
            headerButtons: header && header.querySelector('#inner-header-container > #buttons'),
        };
    }

    detectChange(newObj, lastObj) {
        return DomEventHandler.detectObjectChange(
            newObj,
            lastObj,
            'header',
            'headerButtons',
        );
    }
}
