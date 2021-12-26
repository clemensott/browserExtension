export default class AtOnceService {
    constructor(func) {
        this.func = func;
        this.promise = null;
    }

    async runInternal(lastPromise, params) {
        try {
            await lastPromise;
        } catch { }
        return this.func(...(params || []));
    }

    async run({
        optional = false,
        params,
    } = {}) {
        if (optional && this.promise) {
            return;
        }

        let promise = null;
        try {
            return await (this.promise = promise = this.runInternal(this.promise, params));
        } finally {
            if (this.promise === promise) {
                this.promise = null;
            }
        }
    }
}
