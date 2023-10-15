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
        if (lastContainer && lastContainer.headerButtons) {
            lastContainer.headerButtons.classList.remove('yt-channel-helper-service-inner-header-container');
        }
        if (newContainer && newContainer.headerButtons) {
            this.channelHidingRenderer.render(
                RootElement(ChannelVideoHiding, { service: this.channelVideoHidingService }),
                newContainer.headerButtons,
            );
            newContainer.headerButtons.classList.add('yt-channel-helper-service-inner-header-container');
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
        if (element instanceof Node && element.dataset.fakeId) {
            const fakeElement = element.parentElement.querySelector(`#${element.dataset.fakeId}`);
            if (fakeElement) {
                ReactDOM.unmountComponentAtNode(fakeElement);
                fakeElement.remove();
                delete element.dataset.fakeId;
            }
        }
    }

    static renderTabVideosCount({ tabElement, ...props }) {
        let fakeElement;
        if (tabElement.dataset.fakeId) {
            fakeElement = tabElement.parentElement.querySelector(`#${tabElement.dataset.fakeId}`);
        }
        if (!fakeElement) {
            const fakeId = `fake-tab-element-${Math.random()}`.replace('.', '');
            const div = document.createElement('div');
            div.innerHTML = tabElement.outerHTML;
            fakeElement = div.firstChild;
            fakeElement.id = fakeId;
            tabElement.parentElement.appendChild(fakeElement);
            tabElement.dataset.fakeId = fakeId;
        }
        ReactDOM.render(
            TabVideosCount({ title: tabElement.innerText, ...props }),
            fakeElement,
        );
    }
}
