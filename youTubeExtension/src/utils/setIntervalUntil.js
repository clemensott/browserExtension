/**
    * Run this function as long as it returns true.
    * @param {Function} func the function to run in the intervall
    * @param {number} timeout the timeout of the interval
    */
export default function setIntervalUntil(func, timeout) {
    const intervalId = setInterval(() => {
        if (!func()) {
            clearInterval(intervalId);
        }
    }, timeout);

    return intervalId;
}