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
        })

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

    start() {
        this.navigationService.start();
    }

    onUrlChange({ detail }) {
        if (detail.isChannelSite === navigationChange.ENTERED) {
            this.channel.start();
        } else if (detail.isChannelSite === navigationChange.LEFT) {
            this.channel.stop();
        }
    }
}