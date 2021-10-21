importIntoWebsite(function () {
    const allEventHandlers = new Map();

    function validate(eventName, handler) {
        if (typeof eventName !== 'string') {
            throw new Error('eventName is not a string');
        }
        if (typeof handler !== 'function') {
            throw new Error('handler is not a function');
        }
    }

    function addEventHandler(eventName, handler) {
        validate(eventName, handler);
        if (!allEventHandlers.has(eventName)) {
            allEventHandlers.set(eventName, []);
        }
        const handlers = allEventHandlers.get(eventName);
        handlers.push(handler);
    }

    function removeEventHandler(eventName, handler) {
        validate(eventName, handler);
        const handlers = allEventHandlers.get(eventName) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    function triggerEvent(eventName, args) {
        validate(eventName, () => { });
        const handlers = allEventHandlers.get(eventName) || [];
        return Promise.all(handlers.map(handler => handler(args)));
    }

    return {
        addEventHandler,
        removeEventHandler,
        triggerEvent,
    }
});