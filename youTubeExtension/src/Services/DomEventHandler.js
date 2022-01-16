import triggerEvent from "../utils/triggerEvent";

function defaultElementsExists(last) {
    return last instanceof Node && document.contains(last);
}

function defautlChangeDetector(current, last) {
    return current !== last;
}

export default class DomEventHandler {
    constructor({ eventName, elementsExists, elementsGetter, changeDetector, timeout, notFoundTimeout }) {
        this.eventName = eventName;
        this.elementsExists = elementsExists || defaultElementsExists;
        this.elementsGetter = elementsGetter;
        this.notFoundTimeout = notFoundTimeout;
        this.timeout = timeout;
        this.changeDetector = changeDetector || defautlChangeDetector;
        this.intervalId = null;
        this.lastElements = null;

        this.onTick = this.onTick.bind(this);
    }

    start() {
        if (!this.intervalId) {
            const timeout = this.notFoundTimeout && !this.lastElements ? this.notFoundTimeout : this.timeout;
            this.intervalId = setInterval(this.onTick, timeout);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    onTick() {
        const currentElements = this.elementsExists(this.lastElements) ?
            this.lastElements : this.elementsGetter();
        if (this.changeDetector(currentElements, this.lastElements)) {
            console.log('dom change:', this.elementsExists(this.lastElements), currentElements, this.lastElements);
            triggerEvent(this.eventName, {
                lastElements: this.lastElements,
                currentElements,
            });
        }

        const changeTimout = this.notFoundTimeout && (this.lastElements ^ currentElements);
        this.lastElements = currentElements;
        if (changeTimout) {
            this.stop();
            this.start();
        }
    }

    addEventListener(callback) {
        document.addEventListener(this.eventName, callback);
    }

    removeEventListener(callback) {
        document.removeEventListener(this.eventName, callback);
    }
}