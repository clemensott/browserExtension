import { navigationChange } from '../constants';
import DomEventHandler from './DomEventHandler';

export default class DomEventService {
    constructor({ navigationService }) {
        this.channel = new DomEventHandler({
            eventName: 'DomEventService.channel',
            elementsGetter: this.getChannelHeader,
            timeout: 1000,
            notFoundTimeout: 100,
        });
        this.masterHeadContainer = new DomEventHandler({
            eventName: 'DomEventService.masterHeadContainer',
            elementsGetter: this.getMasterHeadContianer,
            timeout: 10000,
            notFoundTimeout: 100,
        });

        this.navigationService = navigationService;
        this.navigationService.addOnUrlChangeEventHandler(this.onUrlChange.bind(this));
    }

    getChannelHeader() {
        return document.querySelector('#channel-container');
    }

    getMasterHeadContianer() {
        return document.querySelector('#masthead > #container');
    }

    start() {
        this.masterHeadContainer.start();
    }

    onUrlChange({ detail }) {
        if (detail.isChannelSite === navigationChange.ENTERED) {
            this.channel.start();
        } else if (detail.isChannelSite === navigationChange.LEFT) {
            this.channel.stop();
        }
    }
}