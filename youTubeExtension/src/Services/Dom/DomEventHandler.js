import triggerEvent from '../../utils/triggerEvent';
import randomString from '../../utils/randomString';


export default class DomEventHandler {
    constructor({ eventName, elementsExists, elementsGetter, changeDetector, onChange, timeout, notFoundTimeout, triggerEventOnRunChange }) {
        this.eventName = eventName || `DomEventHandler.${randomString()}.change`;
        this.notFoundTimeout = notFoundTimeout;
        this.timeout = timeout;
        this.lastTimeout = null;
        this.triggerEventOnRunChange = triggerEventOnRunChange || false;
        this.intervalId = null;
        this.lastElements = null;

        if (elementsExists) {
            this.elementsExists = elementsExists;
        }
        if (elementsGetter) {
            this.getElements = elementsGetter;
        }
        if (changeDetector) {
            this.detectChange = changeDetector;
        }
        if (onChange) {
            this.onChange = onChange;
        }

        this.onTick = this.onTick.bind(this);
    }

    start() {
        if (!this.intervalId) {
            const timeout = this.getIntervalTimeount(this.lastElements);
            this.intervalId = setInterval(this.onTick, timeout);
            this.lastTimeout = timeout;

            if (this.triggerEventOnRunChange) {
                this.triggerEvent({
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
                this.triggerEvent({
                    lastElements: this.lastElements,
                    currentElements: null,
                });
            }
        }
    }

    onTick() {
        const currentElements = this.elementsExists(this.lastElements) ?
            this.lastElements : this.getElements(this.lastElements);
        if (this.detectChange(currentElements, this.lastElements)) {
            this.triggerEvent({
                lastElements: this.lastElements,
                currentElements,
            });
        }

        this.updateIntervalTime(currentElements);
        this.lastElements = currentElements;
    }

    elementsExists(last) {
        return last instanceof Node && document.contains(last);
    }

    getElements(last) {
        throw new Error(`Abstract function: ${this.eventName}`);
    }

    detectChange(current, last) {
        return current !== last;
    }

    static detectObjectChange(newObj, lastObj, ...keys) {
        return !(newObj === lastObj || (
            newObj && lastObj && keys.flat().every(key => newObj[key] === lastObj[key])
        ));
    }

    triggerEvent(args) {
        this.onChange(args);
        triggerEvent(this.eventName, args);
    }

    updateIntervalTime(currentElements) {
        const timeout = this.getIntervalTimeount(currentElements);
        if (timeout !== this.lastTimeout) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(this.onTick, timeout);
            this.lastTimeout = timeout;
        }
    }

    getIntervalTimeount(currentElements) {
        return !currentElements && this.notFoundTimeout ? this.notFoundTimeout : this.timeout;
    }

    onChange(args) {

    }

    addEventListener(callback) {
        document.addEventListener(this.eventName, callback);
    }

    removeEventListener(callback) {
        document.removeEventListener(this.eventName, callback);
    }
}