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

    function tryIgonore(func) {
        try {
            return func();
        } catch {
            return null;
        }
    }

    return {
        groupBy,
        tryIgonore,
    };
});