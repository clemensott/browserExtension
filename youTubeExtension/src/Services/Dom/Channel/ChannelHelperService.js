import React from 'react';
import ReactDOM from 'react-dom';
import ReactRenderer from '../../../utils/ReactRenderer';
import ChannelVideoHiding from '../../../components/ChannelVideoHiding';
import VideosTabCount from '../../../components/VideosTabCount';
import './ChannelHelperService.css';


export default class ChannelHelperService {
    constructor({ channelVideoHidingService, domService }) {
        this.channelVideoHidingService = channelVideoHidingService;

        this.domService = domService;

        this.channelHidingRenderer = new ReactRenderer({
            className: 'yt-channel-helper-service-own-container',
            beforeSelector: '#buttons',
        });
    }

    init() {
        this.domService.channel.addEventListener(this.onChannelChange.bind(this));
        this.domService.channelVideosCount.addEventListener(this.onChannelVideosChange.bind(this));
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

    onChannelVideosChange({ detail: { currentElements: newObj, lastElements: lastObj } }) {
        if (lastObj && lastObj.videosTab instanceof Node && (!newObj || newObj.videosTab !== lastObj.videosTab)) {
            ReactDOM.render(<VideosTabCount />, lastObj.videosTab);
        }

        if (newObj && newObj.videosTab) {
            ReactDOM.render(<VideosTabCount {...newObj} />, newObj.videosTab);
        }
    }
}
