import DomEventHandler from '../DomEventHandler';


export default class ChannelPlayerDomEventHandler extends DomEventHandler {
    constructor() {
        super({
            eventName: 'ChannelPlayerDomEventHandler.change',
            elementsGetter: ChannelPlayerDomEventHandler.getChannelHeader,
            timeout: 5000,
            notFoundTimeout: 100,
            triggerEventOnRunChange: true,
        });

        this.onSomething = this.onSomething.bind(this);
    }

    static getChannelHeader() {
        return document.querySelector('ytd-channel-video-player-renderer ytd-player video');
    }

    onChange({ lastElements, currentElements }) {
        if (lastElements instanceof Node) {
            this.unsubscribe(lastElements);
        }
        if (currentElements instanceof Node) {
            if (currentElements.readyState >= 3 || !currentElements.paused) {
                currentElements.pause();
            } else {
                this.subscribe(currentElements);
            }
        }
    }

    subscribe(element) {
        element.addEventListener('play', this.onSomething);
        element.addEventListener('canplay', this.onSomething);
        element.addEventListener('timeupdate ', this.onSomething);
    }

    unsubscribe(element) {
        element.removeEventListener('play', this.onSomething);
        element.removeEventListener('canplay', this.onSomething);
        element.removeEventListener('timeupdate ', this.onSomething);
    }

    onSomething({ target }) {
        if (!target.paused) {
            target.pause();
            this.unsubscribe(target);
        }
    }
}
