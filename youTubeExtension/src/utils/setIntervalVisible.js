export default function setIntervalVisible({
    callback,
    timeout,
    triggerOnVisable,
    args = [],
}) {
    let intervalId = null;
    function onVisibilityChange() {
        if (document.hidden && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        } else if (!document.hidden && !intervalId) {
            intervalId = setInterval(callback, timeout, ...args);
            if (triggerOnVisable) {
                callback(...args);
            }
        }
    }
    
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();

    return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);

        clearInterval(intervalId);
        intervalId = null;
    };
}
