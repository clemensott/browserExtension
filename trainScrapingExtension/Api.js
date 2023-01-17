class Api {
    constructor(baseUrl, username, password) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }

    getUrl(path, query) {
        const search = query && Object.entries(query).map(
            ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`,
        ).join('&');
        return `${this.baseUrl}${path}?${search}`;
    }

    fetch(path, { query, method, body, headers }) {
        return fetch(this.getUrl(path, query), {
            method,
            headers: {
                ...(body ? { 'Content-Type': 'application/json', } : null),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        })
    }

    metaId = 1;
    async getDnyMetas({ rangeStart, rangeEnd }) {
        return (async () => {
            if (!(rangeStart instanceof Date)) {
                throw new Error('rangeStart is not a Date');
            }
            if (!(rangeEnd instanceof Date)) {
                throw new Error('rangeEnd is not a Date');
            }
            await new Promise(r => setTimeout(r, 10));
            const start = rangeStart.getTime();
            const end = rangeEnd.getTime();
            const result = [];

            let currentPos = start;
            while (currentPos < end) {
                const addMinuets = 0.5 + Math.random();
                currentPos = Math.floor(currentPos + addMinuets * 60 * 1000);
                result.push({
                    id: this.metaId++,
                    timestamp: new Date(currentPos).toISOString(),
                });
            }

            return result;
        })();

        const response = await this.fetch('/api/dny/meta', {
            body: {
                rangeStart,
                rangeEnd,
            },
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(await response.text());
    }

    async getDnys(ids) {
        return (async () => {
            await new Promise(r => setTimeout(r, 10));
            const sample = window.dnySample;
            return ids.map(id => ({
                ...sample,
                t: sample.t.map(t => ({
                    ...t,
                    x: t.p[id % t.p.length].x,
                    y: t.p[id % t.p.length].y,
                    p: undefined,
                })),
                id,
            }));
        })();

        const response = await this.fetch('/api/dny/list', {
            body: { ids },
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(await response.text());
    }
}