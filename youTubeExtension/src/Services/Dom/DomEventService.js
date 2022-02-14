import { navigationChange } from '../../constants';
import ChannelDomEventHandler from './Channel/ChannelDomEventHandler';
import ChannelVideosDomEventHandler from './Channel/ChannelVideosDomEventHandler';
import DomEventHandler from './DomEventHandler';
import ReloadSubscriptionBoxDomEventHandler from './ReloadSubscriptionBoxDomEventHandler';

export default class DomEventService {
    constructor({ optionsService, navigationService, updateSourcesTrackerService }) {
        this.channel = new ChannelDomEventHandler();
        this.channelVideosCount = new ChannelVideosDomEventHandler({
            updateTrackerService: updateSourcesTrackerService,
        });
        this.masterHeadContainer = new DomEventHandler({
            eventName: 'DomEventService.masterHeadContainer',
            elementsGetter: this.getMasterHeadContianer,
            timeout: 10000,
            notFoundTimeout: 100,
        });
        this.reloadSubscriptionBoxDomEventHandler = new ReloadSubscriptionBoxDomEventHandler(optionsService);

        this.navigationService = navigationService;
        this.navigationService.addOnUrlChangeEventHandler(this.onUrlChange.bind(this));
    }

    getMasterHeadContianer() {
        return document.querySelector('#masthead > #container');
    }

    start() {
        this.channelVideosCount.init();
        this.masterHeadContainer.start();
    }

    onUrlChange({ detail }) {
        if (detail.isChannelSite === navigationChange.ENTERED) {
            this.channel.start();
        } else if (detail.isChannelSite === navigationChange.LEFT) {
            this.channel.stop();
        }

        if (detail.isChannelVideosSite === navigationChange.ENTERED) {
            this.channelVideosCount.start();
        } else if (detail.isChannelVideosSite === navigationChange.LEFT) {
            this.channelVideosCount.stop();
        }

        if (detail.isSubscriptionBoxSite === navigationChange.ENTERED) {
            this.reloadSubscriptionBoxDomEventHandler.start();
        } else if (detail.isSubscriptionBoxSite === navigationChange.LEFT) {
            this.reloadSubscriptionBoxDomEventHandler.stop();
        }
    }
}