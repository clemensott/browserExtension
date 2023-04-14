import { navigationChange } from '../../constants';
import ChannelDomEventHandler from './Channel/ChannelDomEventHandler';
import ChannelVideosDomEventHandler from './Channel/ChannelVideosDomEventHandler';
import ChannelPlayerDomEventHandler from './Channel/ChannelPlayerDomEventHandler';
import DomEventHandler from './DomEventHandler';
import HideWatchVideoElementsService from './HideWatchVideoElementsService';
import ReloadSubscriptionBoxDomEventHandler from './ReloadSubscriptionBoxDomEventHandler';

export default class DomEventService {
    constructor({ optionsService, navigationService, updateSourcesTrackerService, filterRecommendedVideosService }) {
        this.channel = new ChannelDomEventHandler();
        this.channelVideosCount = new ChannelVideosDomEventHandler({
            updateTrackerService: updateSourcesTrackerService,
        });
        this.channelPlayer = new ChannelPlayerDomEventHandler();
        this.masterHeadContainer = new DomEventHandler({
            eventName: 'DomEventService.masterHeadContainer',
            elementsGetter: this.getMasterHeadContianer,
            timeout: 10000,
            notFoundTimeout: 100,
        });
        this.reloadSubscriptionBoxDomEventHandler = new ReloadSubscriptionBoxDomEventHandler(optionsService);
        this.hideWatchVideosElementsHandler = new HideWatchVideoElementsService({ optionsService });
        this.filterRecommendedVideosService = filterRecommendedVideosService;

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

        if (detail.isChannelFeaturedSite === navigationChange.ENTERED) {
            this.channelPlayer.start();
        } else if (detail.isChannelFeaturedSite === navigationChange.LEFT) {
            this.channelPlayer.stop();
        }

        const channelVideoSites = [
            detail.isChannelVideosSite,
            detail.isChannelShortsSite,
            detail.isChannelLiveSite,
        ];
        if (channelVideoSites.includes(navigationChange.ENTERED)) {
            this.channelVideosCount.start();
        } else if (channelVideoSites.includes(navigationChange.LEFT)) {
            this.channelVideosCount.stop();
        }

        if (detail.isSubscriptionBoxSite === navigationChange.ENTERED) {
            this.reloadSubscriptionBoxDomEventHandler.start();
        } else if (detail.isSubscriptionBoxSite === navigationChange.LEFT) {
            this.reloadSubscriptionBoxDomEventHandler.stop();
        }

        if (detail.isVideoWatchSite === navigationChange.ENTERED) {
            this.hideWatchVideosElementsHandler.start();
        } else if (detail.isVideoWatchSite === navigationChange.LEFT) {
            this.hideWatchVideosElementsHandler.stop();
        }

        if (detail.isVideoWatchSite === navigationChange.ENTERED) {
            this.filterRecommendedVideosService.start();
        } else if (detail.isVideoWatchSite === navigationChange.LEFT) {
            this.filterRecommendedVideosService.stop();
        }
    }
}