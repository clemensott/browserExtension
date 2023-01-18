class DnyLoader {
    constructor(api) {
        this.api = api;

        this.isSimpleGetting = false;
        this.lastMeta = null;
        this.lastDny = null;
    }

    async getDnyAfter(timestamp) {
        if (this.isSimpleGetting) {
            return null;
        }
        try {
            this.isSimpleGetting = true;

            if (!(this.lastMeta && utcToUnix(this.lastMeta.timestamp) > timestamp)) {
                const metas = await this.api.getDnyMetas({
                    rangeStart: new Date(timestamp),
                    limit: 1,
                });
                this.lastMeta = metas[0];
            }

            if (!this.lastMeta) {
                return null;
            }

            const lastMetaId = this.lastMeta.id
            if (!this.lastDny || this.lastDny.id !== lastMetaId) {
                const dnys = await this.api.getDnys([lastMetaId]);
                this.lastDny = dnys[0];
            }

            return this.lastDny;
        } finally {
            this.isSimpleGetting = false;
        }
    }
}