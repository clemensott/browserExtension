import { navigationChange } from '../constants';
import DomEventHandler from './DomEventHandler';
import NavigationEventService from './NavigationEventService';

let instance = null;

export default class DomEventService {
    constructor() {
        this.channel = new DomEventHandler({
            eventName: 'DomEventService.channel',
            elementsGetter: this.getChannelHeader,
            timeout: 500,
        });
        this.masterHeadContainer = new DomEventHandler({
            eventName: 'DomEventService.masterHeadContainer',
            elementsGetter: this.getMasterHeadContianer,
            timeout: 10000,
            notFoundTimeout: 100,
        });

        this.navigationService = NavigationEventService.getInstance();
        this.navigationService.addOnUrlChangeEventHandler(this.onUrlChange.bind(this));
    }

    static getInstance() {
        if (!instance) {
            instance = new DomEventService();
        }
        return instance;
    }

    getChannelHeader() {
        return document.querySelector('#channel-container');
    }

    getMasterHeadContianer() {
        return document.querySelector('#masthead > #container');
    }

    start() {
        this.navigationService.start();
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