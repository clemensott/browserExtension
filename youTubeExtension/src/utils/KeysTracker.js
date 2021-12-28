export default class KeysTracker {
    constructor() {
        this.map = new Map();
    }

    add(keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        keys.forEach(key => {
            const count = this.map.get(key) || 0;
            this.map.set(key, count + 1);
        });
    }

    remove(keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        keys.forEach(key => {
            const count = this.map.get(key) || 0;
            if (count > 1) this.map.set(key, count - 1);
            else this.map.delete(key);
        });
    }

    has(key) {
        return this.map.has(key);
    }

    get(key) {
        return this.map.get(key);
    }

    totalCount() {
        const values = Array.from(this.map.values());
        return values.reduce((sum, count) => sum + count, 0);
    }

    keys() {
        return this.map.keys();
    }

    clear() {
        this.map.clear();
    }
}
