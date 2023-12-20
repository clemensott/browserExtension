import { InfluxDB } from '@influxdata/influxdb-client';
import { PingAPI } from '@influxdata/influxdb-client-apis';

export class Api {
    constructor({
        url,
        org,
        token,
        bucket = 'train_scrapings',
        timeout = 10 * 1000,
    }) {
        this.bucket = bucket;
        this.influxClient = new InfluxDB({
            url,
            token,
            timeout,
        });
        this.pingApi = new PingAPI(this.influxClient);
        this.queryApi = this.influxClient.getQueryApi(org);
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
            await this.pingApi.getPing();
            return true;
        } catch {
            return false;
        }
    }

    async searchTrainNames({ needle, start, limit }) {
        needle = needle.replace(/[#.]|[[-^]|[?|{}()]/g, '')
            .replace(/ +/g, ' +');
        const fluxQuery = `
            from(bucket: "${this.bucket}")
            |> range(start: ${start})
            |> filter(fn: (r) => r._measurement == "dny_train")
            |> filter(fn: (r) => r.name =~ /^(${needle})/)
            |> filter(fn: (r) => r._field == "train_id")
            |> group(columns: ["name"])
            |> first()
            |> group(columns: ["_measurement"])
            |> limit(n: ${limit ?? 50})
        `;
        const allValues = [];
        for await (const { values, tableMeta } of this.queryApi.iterateRows(fluxQuery)) {
            const { index } = tableMeta.columns.find(c => c.label === 'name');
            allValues.push(values[index]);
        }

        return allValues;
    }

    async getTrainDestinations({ trainNames, start }) {
        const trainNameCondition = trainNames.map(name => `r.name == "${name}"`).join(' or ');
        if (!trainNameCondition) return [];

        const fluxQuery = `
            import "strings"
            from(bucket: "${this.bucket}")
            |> range(start: ${start})
            |> filter(fn: (r) => r._measurement == "dny_train")
            |> filter(fn: (r) => ${trainNameCondition})
            |> filter(fn: (r) => r._field == "train_id")
            |> first()
        `;
        const allValues = [];
        for await (const { values, tableMeta } of this.queryApi.iterateRows(fluxQuery)) {
            const o = tableMeta.toObject(values);
            allValues.push({
                destination: o.destination,
                name: o.name,
            });
        }

        return allValues;
    }

    async getTrainData({ trains, start }) {
        const trainCondition = trains.map(t => `r.name == "${t.name}" and r.destination == "${t.destination}"`).join(' or ');
        if (!trainCondition) return [];
        const fluxQuery = `
            from(bucket: "${this.bucket}")
            |> range(start: ${start})
            |> filter(fn: (r) => r._measurement == "dny_train")
            |> filter(fn: (r) => ${trainCondition})
        `;

        const trainData = new Map();
        for await (const { values, tableMeta } of this.queryApi.iterateRows(fluxQuery)) {
            const o = tableMeta.toObject(values);
            const key = `${o.name}|${o.destination}`;
            let train = trainData.get(key);
            if (!train) {
                train = {
                    name: o.name,
                    destination: o.destination,
                    data: new Map(),
                };
                trainData.set(key, train);
            }

            const entry = train.data.get(o._time);
            if (entry) {
                entry[o._field] = o._value;
            } else {
                train.data.set(o._time, {
                    time: o._time,
                    [o._field]: o._value,
                });
            }
        }

        return [...trainData.values()].map(t => ({
            ...t,
            data: [...t.data.values()],
        }));
    }
}
