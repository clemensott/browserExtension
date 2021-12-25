importIntoWebsite(function () {
    function groupBy(array, keySelector) {
        const map = new Map();
        array.forEach(obj => {
            const key = keySelector(obj);
            if (map.has(key)) {
                map.get(key).push(obj);
            } else {
                map.set(key, [obj]);
            }
        })
        return map;
    }

    function tryIgnore(func) {
        try {
            return func();
        } catch {
            return null;
        }
    }

    function getVideoIdFromUrl(url) {
        const { pathname, searchParams } = new URL(url);
        if (pathname.startsWith('/shorts/')) {
            const parts = pathname.split('/');
            if (parts.length > 2) {
                return parts[2];
            }
        }
        return searchParams.get('v');
    }

    /**
     * Run this function as long as it returns true.
     * @param {Function} func the function to run in the intervall
     * @param {number} timeout the timeout of the interval
     */
    function setIntervalUntil(func, timeout) {
        const intervalId = setInterval(() => {
            if (!func()) {
                clearInterval(intervalId);
            }
        }, timeout);

        return intervalId;
    }

    return {
        groupBy,
        tryIgnore,
        getVideoIdFromUrl,
        setIntervalUntil,
    };
});