import triggerEvent from '../../utils/triggerEvent';

function defaultElementsExists(last) {
    return last instanceof Node && document.contains(last);
}

function defautlChangeDetector(current, last) {
    return current !== last;
}

export default class DomEventHandler {
    constructor({ eventName, elementsExists, elementsGetter, changeDetector, timeout, notFoundTimeout, triggerEventOnRunChange }) {
        this.eventName = eventName;
        this.elementsExists = elementsExists || defaultElementsExists;
        this.elementsGetter = elementsGetter;
        this.notFoundTimeout = notFoundTimeout;
        this.timeout = timeout;
        this.changeDetector = changeDetector || defautlChangeDetector;
        this.triggerEventOnRunChange = triggerEventOnRunChange || false;
        this.intervalId = null;
        this.lastElements = null;

        this.onTick = this.onTick.bind(this);
    }

    start() {
        if (!this.intervalId) {
            const timeout = this.notFoundTimeout && !this.lastElements ? this.notFoundTimeout : this.timeout;
            this.intervalId = setInterval(this.onTick, timeout);

            if (this.triggerEventOnRunChange) {
                triggerEvent(this.eventName, {
                    lastElements: null,
                    currentElements: this.lastElements,
                });
                this.onTick();
            }
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;

            if (this.triggerEventOnRunChange) {
                triggerEvent(this.eventName, {
                    lastElements: this.lastElements,
                    currentElements: null,
                });
            }
        }
    }

    onTick() {
        const currentElements = this.elementsExists(this.lastElements) ?
            this.lastElements : this.elementsGetter(this.lastElements);
        if (this.changeDetector(currentElements, this.lastElements)) {
            triggerEvent(this.eventName, {
                lastElements: this.lastElements,
                currentElements,
            });
        }

        if (this.intervalId && this.notFoundTimeout && (!!this.lastElements ^ !!currentElements)) {
            const timeout = currentElements ? this.timeout : this.notFoundTimeout;
            clearInterval(this.intervalId);
            this.intervalId = setInterval(this.onTick, timeout);
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