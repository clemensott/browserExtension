importIntoWebsite(function () {
    function triggerEvent(eventName, args) {
        const customEvent = new CustomEvent(eventName, {
            detail: args,
        });
        document.dispatchEvent(customEvent);
    }

    return {
        triggerEvent,
    }
});