export default function triggerEvent(eventName, args) {
    const customEvent = new CustomEvent(eventName, {
        detail: args,
    });
    document.dispatchEvent(customEvent);
}