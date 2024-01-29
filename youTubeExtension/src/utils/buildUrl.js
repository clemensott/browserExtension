export function buildUrl({ origin, pathname, search, hash }) {
    let url = origin + pathname;
    if (search) {
        url += `?${search}`;
    }
    if (hash) {
        url += `?${hash}`;
    }
    return url;
}
