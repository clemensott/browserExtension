import DomEventService from './DomEventService';
import ChannelVideoHidingService from './ChannelVideoHidingService';
import './ChannelHelperService.css';

function getChannelVideoHidingControlHtml(checked) {
    return `
        <span class="yt-channel-helper-service-hide-videos-contianer">
            <input id="channel_video_hiding" type="checkbox" ${checked ? 'checked' : ''}>
            <label for="channel_video_hiding">Video hiding</label>
        </span>
    `;
}

export default class ChannelHelperService {
    constructor() {
        this.channelVideoHidingService = ChannelVideoHidingService.getInstance();
        this.channelVideoHidingService.addRunningChangeEventListener(this.onChannelHidingRunningChange.bind(this));

        this.domService = DomEventService.getInstance();
        this.domService.channel.addEventListener(this.onChannelChange.bind(this));

        this.onChannelVideoHidingCheckboxChange = this.onChannelVideoHidingCheckboxChange.bind(this);
    }

    start() {
        this.domService.start();
    }

    onChannelHidingRunningChange({ detail: { isRunning } }) {
        if (this.channelOwnContainer) {
            const input = this.channelOwnContainer.querySelector('#channel_video_hiding');
            if (input) {
                input.checked = isRunning;
            }
        }
    }

    onChannelChange({ detail: { currentElements: container, lastElements } }) {
        if (this.channelOwnContainer) {
            const input = this.channelOwnContainer.querySelector('#channel_video_hiding');
            if (input) {
                input.removeEventListener('change', this.onChannelVideoHidingCheckboxChange);
            }
            this.channelOwnContainer.remove();
            this.channelOwnContainer = null;
        }
        if (container) {
            const innerHeaderContainer = container.querySelector('#inner-header-container');
            const buttonsElement = innerHeaderContainer.querySelector('#buttons');

            this.channelOwnContainer = document.createElement('div');
            this.channelOwnContainer.classList.add('yt-channel-helper-service-own-container');
            this.channelOwnContainer.innerHTML = getChannelVideoHidingControlHtml(this.channelVideoHidingService.isHiding());

            const input = this.channelOwnContainer.querySelector('#channel_video_hiding');
            if (input) {
                input.addEventListener('change', this.onChannelVideoHidingCheckboxChange);
            }

            innerHeaderContainer.insertBefore(this.channelOwnContainer, buttonsElement);
            innerHeaderContainer.classList.add('yt-channel-helper-service-inner-header-container');
        }
    }

    onChannelVideoHidingCheckboxChange({ target }) {
        if (target.checked) {
            this.channelVideoHidingService.start();
        } else {
            this.channelVideoHidingService.stop();
        }
    }
}