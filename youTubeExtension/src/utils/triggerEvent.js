export default function triggerEvent(eventName, args = null) {
    const customEvent = new CustomEvent(eventName, {
        detail: args,
    });
    document.dispatchEvent(customEvent);
}
