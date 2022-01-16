import React from 'react';
import DomEventService from './DomEventService';
import ChannelVideoHidingService from './ChannelVideoHidingService';
import ReactRenderer from '../utils/ReactRenderer';
import ChannelVideoHiding from '../components/ChannelVideoHiding';
import './ChannelHelperService.css';


export default class ChannelHelperService {
    constructor() {
        this.channelVideoHidingService = ChannelVideoHidingService.getInstance();

        this.domService = DomEventService.getInstance();
        this.domService.channel.addEventListener(this.onChannelChange.bind(this));

        this.channelHidingRederer = new ReactRenderer({
            className: 'yt-channel-helper-service-own-container',
            beforeSelector: '#buttons',
        });
    }

    start() {
        this.domService.start();
    }

    onChannelChange({ detail: { currentElements: newContainer, lastElements: lastContainer } }) {
        if (lastContainer) {
            const innerHeaderContainer = container.querySelector('#inner-header-container');
            innerHeaderContainer.classList.remove('yt-channel-helper-service-inner-header-container');
        }
        if (newContainer) {
            const innerHeaderContainer = newContainer.querySelector('#inner-header-container');

            this.channelHidingRederer.render(
                <ChannelVideoHiding service={this.channelVideoHidingService} />,
                innerHeaderContainer,
            );
            innerHeaderContainer.classList.add('yt-channel-helper-service-inner-header-container');
        } else {
            this.channelHidingRederer.unmount();
        }
    }
}
