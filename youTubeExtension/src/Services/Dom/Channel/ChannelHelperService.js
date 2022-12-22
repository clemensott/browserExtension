import React from 'react';
import ReactDOM from 'react-dom';
import ReactRenderer from '../../../utils/ReactRenderer';
import ChannelVideoHiding from '../../../components/ChannelVideoHiding';
import TabVideosCount from '../../../components/TabVideosCount';
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
        if (lastObj && lastObj.tabElement instanceof Node && (!newObj || newObj.tabElement !== lastObj.tabElement)) {
            ChannelHelperService.revertTabText(lastObj.tabElement);
        }

        if (newObj && newObj.tabElement) {
            ChannelHelperService.renderTabVideosCount(newObj);
        }
    }

    static revertTabText(element) {
        console.log('restore tab text:', element.innerText, element.dataset.title, element);
        if (element.dataset.title) {
            ReactDOM.unmountComponentAtNode(element);
            element.innerText = element.dataset.title;
        }
    }

    static renderTabVideosCount({ tabElement, ...props }) {
        console.log('render tab text:', tabElement.innerText, tabElement.dataset.title, props,tabElement);
        if (!tabElement.dataset.title) {
            tabElement.dataset.title = tabElement.innerText;
        }
        ReactDOM.render(
            <TabVideosCount title={tabElement.dataset.title} {...props} />,
            tabElement,
        );
    }
}
