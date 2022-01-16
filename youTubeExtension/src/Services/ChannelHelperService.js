import React from 'react';
import ReactRenderer from '../utils/ReactRenderer';
import ChannelVideoHiding from '../components/ChannelVideoHiding';
import './ChannelHelperService.css';


export default class ChannelHelperService {
    constructor({ channelVideoHidingService, domService }) {
        this.channelVideoHidingService = channelVideoHidingService;

        this.domService = domService;
        this.domService.channel.addEventListener(this.onChannelChange.bind(this));

        this.channelHidingRenderer = new ReactRenderer({
            className: 'yt-channel-helper-service-own-container',
            beforeSelector: '#buttons',
        });
    }

    start() {
    }

    onChannelChange({ detail: { currentElements: newContainer, lastElements: lastContainer } }) {
        if (lastContainer) {
            const innerHeaderContainer = container.querySelector('#inner-header-container');
            innerHeaderContainer.classList.remove('yt-channel-helper-service-inner-header-container');
        }
        if (newContainer) {
            const innerHeaderContainer = newContainer.querySelector('#inner-header-container');

            this.channelHidingRenderer.render(
                <ChannelVideoHiding service={this.channelVideoHidingService} />,
                innerHeaderContainer,
            );
            innerHeaderContainer.classList.add('yt-channel-helper-service-inner-header-container');
        } else {
            this.channelHidingRenderer.unmount();
        }
    }
}
