export default function groupBy(array, keySelector) {
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