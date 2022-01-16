import triggerEvent from "../utils/triggerEvent";

function defaultElementsExists(last) {
    return last instanceof Node && document.contains(last);
}

function defautlChangeDetector(current, last) {
    return current !== last;
}

export default class DomEventHandler {
    constructor({ eventName, elementsExists, elementsGetter, changeDetector, timeout }) {
        this.eventName = eventName;
        this.elementsExists = elementsExists || defaultElementsExists;
        this.elementsGetter = elementsGetter;
        this.timeout = timeout;
        this.changeDetector = changeDetector || defautlChangeDetector;
        this.intervalId = null;
        this.lastElements = null;

        this.onTick = this.onTick.bind(this);
    }

    start() {
        if (!this.intervalId) {
            this.intervalId = setInterval(this.onTick, this.timeout);
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

        this.lastElements = currentElements;
    }

    addEventListener(callback) {
        document.addEventListener(this.eventName, callback);
    }

    removeEventListener(callback) {
        document.removeEventListener(this.eventName, callback);
    }
}