class DnyLoader {
    constructor(api) {
        this.loadMillis = 5000;
        this.loadTargetSizeMillis = 10000;
        this.api = api;

        this.metas = [];
        this.dnys = new Map();
        this.lastTimestamp = null;
        this.lastMetaIndex = null;

        this.currentAppendMetasPromise = null;
        this.currentLoadDnysPromise = null;
    }

    clear() {
        this.metas = [];
        this.dnys = new Map();
        this.lastTimestamp = null;
        this.lastMetaIndex = null;
    }

    findDnyAfter(iso) {
        const startIndex = iso > this.lastTimestamp ? this.lastMetaIndex : 0;
        for (let i = startIndex; i < this.metas.length; i++) {
            if (this.metas[i].timestamp > iso) {
                return i;
            }
        }
        return null;
    }

    getDnyMetas(start, speed) {
        return this.api.getDnyMetas({
            rangeStart: start,
            rangeEnd: start.addMilliseconds(this.loadMillis * speed),
        });
    }

    appendMetas(start, speed) {
        const append = async () => {
            const nextMetas = await this.getDnyMetas(start, speed);
            this.metas = this.metas.concat(nextMetas);
            return nextMetas;
        };

        return this.currentAppendMetasPromise = append();
    }

    async appendMetasFinised() {
        await this.currentAppendMetasPromise;
        this.currentAppendMetasPromise = null;
    }

    async getNextMeta(timestamp, speed) {
        const date = new Date(timestamp);
        const iso = date.toISOString();
        let nextMetaIndex = this.findDnyAfter(iso);
        if (!nextMetaIndex) {
            await this.appendMetasFinised();
        }

        nextMetaIndex = this.findDnyAfter(iso);
        if (!nextMetaIndex) {
            await this.appendMetas(date, speed);
            nextMetaIndex = this.findDnyAfter(iso);

        }

        this.lastMetaIndex = nextMetaIndex;
        return this.metas[nextMetaIndex];
    }

    checkMetaCache(speed) {
        if (!this.currentAppendMetasPromise) {
            const loadTargetDate = date.addMilliseconds(this.loadTargetSizeMillis * speed);
            const lastMeta = this.metas[this.metas.length - 1];
            if (loadTargetDate.toISOString() > lastMeta.timestamp) {
                this.appendMetas(new Date(lastMeta.timestamp), speed);
            }
        }
    }

    loadDnys(ids) {
        const load = async () => {
            const result = await this.api.getDnys(ids);
            if (result) {
                result.forEach(dny => this.dnys.set(dny.id, dny));
            }
        };
        return this.currentLoadDnysPromise = load();
    }

    async loadDnysFinised() {
        await this.currentLoadDnysPromise;
        this.currentLoadDnysPromise = null;
    }

    async getDny(id) {
        let dny = this.dnys.get(id);
        if (!dny) {
            await this.loadDnysFinised();
        }

        dny = this.dnys.get(id);
        if (dny) {
            return dny;
        }

        await this.loadDnys([id]);
        return this.dnys.get(id);
    }

    checkDnyCache() {
        if (!this.currentLoadDnysPromise) {

        }
    }

    async getDnyAfter(timestamp, speed) {
        const meta = await this.getNextMeta(timestamp, speed);
        this.checkMetaCache(speed);
        if (!meta) {
            return null;
        }

        const dny = await this.getDny(meta.id);
        this.checkDnyCache();
        return dny;
    }
}