import ReactDOM from 'react-dom';
import ReactRenderer from '../../../utils/ReactRenderer';
import ChannelVideoHiding from '../../../components/ChannelVideoHiding';
import TabVideosCount from '../../../components/TabVideosCount';
import './ChannelHelperService.css';
import RootElement from '../../../components/RootElement';


export default class ChannelHelperService {
    constructor({ channelVideoHidingService, domService }) {
        this.channelVideoHidingService = channelVideoHidingService;

        this.domService = domService;

        this.channelHidingRenderer = new ReactRenderer({
            className: 'yt-channel-helper-service-own-container',
            beforeSelector: '#purchase-button',
        });
    }

    init() {
        this.domService.channel.addEventListener(this.onChannelChange.bind(this));
        this.domService.channelVideosCount.addEventListener(this.onChannelVideosChange.bind(this));
    }

    onChannelChange({ detail: { currentElements: newContainer, lastElements: lastContainer } }) {  
        if (lastContainer && lastContainer.header) {
            lastContainer.header.classList.remove('yt-channel-helper-service-inner-header-container');
        }
        if (newContainer && newContainer.header) {
            this.channelHidingRenderer.render(
                RootElement(ChannelVideoHiding, { service: this.channelVideoHidingService }),
                newContainer.header,
            );
            newContainer.header.classList.add('yt-channel-helper-service-inner-header-container');
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
        const fakeElement = element instanceof Node && element.querySelector('[fake-tab-element]');
        if (fakeElement) {
            ReactDOM.unmountComponentAtNode(fakeElement);
            fakeElement.remove();
        }
    }

    static renderTabVideosCount({ tabElement, ...props }) {
        const actualTabElement = tabElement.querySelector('.yt-tab-shape-wiz__tab:not([data-fake-tab-element])');
        if (!actualTabElement) {
            return;
        }

        let fakeElement = tabElement.querySelector('[data-fake-tab-element]');
        if (!fakeElement) {
            const div = document.createElement('div');
            div.innerHTML = actualTabElement.outerHTML;
            fakeElement = div.firstChild;
            fakeElement.dataset.fakeTabElement = true;
            tabElement.insertBefore(fakeElement, actualTabElement);
        }
        ReactDOM.render(
            TabVideosCount({ title: actualTabElement.innerText, ...props }),
            fakeElement,
        );
    }
}
