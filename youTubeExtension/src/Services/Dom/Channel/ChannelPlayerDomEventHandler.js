import DomEventHandler from '../DomEventHandler';


export default class ChannelPlayerDomEventHandler extends DomEventHandler {
    constructor(navigationService) {
        super({
            eventName: 'ChannelPlayerDomEventHandler.change',
            elementsGetter: ChannelPlayerDomEventHandler.getChannelHeader,
            timeout: 5000,
            notFoundTimeout: 100,
            triggerEventOnRunChange: true,
        });

        this.navigationService = navigationService;
        this.paused = true;

        this.onUrlChange = this.onUrlChange.bind(this);
        this.onSomething = this.onSomething.bind(this);
    }

    static getChannelHeader() {
        return document.querySelector('ytd-channel-video-player-renderer ytd-player video');
    }

    start() {
        this.navigationService.addOnUrlChangeEventHandler(this.onUrlChange);
        super.start();
    }

    stop() {
        this.navigationService.removeOnUrlChangeEventHandler(this.onUrlChange);
        super.stop();
    }

    onUrlChange() {
        this.paused = false;
    }

    onChange({ lastElements, currentElements }) {
        if (lastElements instanceof Node) {
            this.unsubscribe(lastElements);
        }
        if (currentElements instanceof Node) {
            this.subscribe(currentElements);
            this.paused = false;

            if (currentElements.readyState >= 3 || !currentElements.paused) {
                currentElements.pause();
                this.paused = true;
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
        if (!this.paused && !target.paused) {
            target.pause();
            this.paused = true;
        }
    }
}
