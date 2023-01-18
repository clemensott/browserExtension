class Api {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    getUrl(path, query) {
        const search = query && Object.entries(query)
            .filter(([key, value]) => key && typeof value !== 'undefined')
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        return `${this.baseUrl}${path}${search ? '?' : ''}${search || ''}`;
    }

    fetch(path, { query, method, body, headers } = {}) {
        return window.fetch(this.getUrl(path, query), {
            method,
            headers: {
                authorization: `Basic ${this.token}`,
                ...(body ? { 'Content-Type': 'application/json', } : null),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        })
    }

    async ping() {
        try {
            const response = await this.fetch('/ping');
            console.log('ping response:', response);
            return response.ok;
        } catch {
            return false;
        }
    }

    async getDnyMetas({ rangeStart, rangeEnd, limit }) {
        const response = await this.fetch('/trains/dnyMetas', {
            query: {
                rangeStart: rangeStart.toUtcIsoString(),
                rangeEnd: rangeEnd && rangeEnd.toUtcIsoString(),
                limit,
            },
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }

    async getDnys(ids) {
        const search = ids.map(id => `ids=${id}`).join('&');
        const response = await this.fetch(`/trains/dnys?${search}`);
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.statusText);
    }
}