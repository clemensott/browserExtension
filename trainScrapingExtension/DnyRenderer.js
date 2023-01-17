class DnyRenderer {
    constructor(map) {
        this.map = map;
        this.lastMarkers = [];
        this.icon = L.icon({
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+1JREFUeNq8VltoU2kQ/nNOkjaedBu12q0oRnxYQTCpCoq32iJlF/dhXbq44EoRfNCXIlgLWlEUwSfR9qUqLhV2hZV9qLeXvnlB1rqySeoqCtbWGotWo70kbZOeJM53mCkxtra11Q+Gc/vn+878Z87M2AzDrcaBjU1n09iAFFuSLc02JuzjCEHAQZbb0nLnJ4/H43O73Ut1Xf8GC5LJZF80Gn3Q09MTWrVq9SW6NUQ2nCH+MRBhltnIdDJXbW3t4nA4fMo0zb70OMAarIUPfJnDls1vy9pSicp148b1X/1+/wmKJk8eDgcfqwRZ8lmXda0vnKec/u+Ug0xAUfcHg8G9JSUb/6LLwY+izYrMQeYJhUI1mW8fbbyc7vL+kO5UvlENz7AmE+AAF3PasiOUyIxbt27uLi4uPi4RRXYcso4TASKd3Xh0JOJAILB//foNDXQak0h1p9OpOOtcZ8+eKSkvL/9dxLpLd6pkR5eaKFIvI2rgYrNyfb9W6d8WqKKiok1er/f21avXwvTYhCAitHEmzg6Hn1+jTFye6ulXr4q3KnMSYh+kvneeKgxcVJonT1EG/zd//oIf6XYEcWi8na4LF/4shxgc+o6c/mwxAL7gAMAJbmhAS5Os9PspJGwLRRc7f0VNFeAAF8DcENQ1/vmNgoKCFXgYv35vZOFUAA5wAcxtQEsEcwxjxlwrWUKP1XRBuJg7RwQ1TpovDWhokjTaVxDUJGk+rNj5edOmMBqXxnUuGYlEOnEjd+PKaRMULua2Ko3GJ8Pt7R3/S3nKmQZRcEiJY26rbWlccobq6ur+lsX5h3dNWTCTg7nRK00RjDU1NT1qbW29LW+Xt2fbZ4vBV3YJnODmAm5K8bZK4N27/3Zu3/7bZrvd7silApzu7VeJO/cnLeY5uc86j8fjgxUVvxzo7u5up8u3ZAkIjswh9CD55s3rcGlp6ToStUMUDTbRcn/c6oOCPYtak+zMEKGmpuZoc3Mzys0raVESYVoGokAg2EvCnWVlZWsg6liyyCKBsM2VY3UAaVnYNmQivtfM0wcV1opYdXX1scbG8zfp8gVZL6LL7viYQdxkC8nWbdny856nT9ufpCcJ+MAXHMzlZm5LJ/MbKvlF8DZtbW3vGhoa/hkYGHhRWFiYP5fwqS19QKivr/+jsrLyHPk+5Mje8lyTGikGowxRGhdalIlZZHP4mF9VVeXz+ZZ5ycewWlAsGguFWjtIKMTbBoHXfMRHj7NYeizBzApk5x4GcjcfDX4ZKfbDTBpji/JxkH+31EQH4RSTmeyMt3dKi+GmLZ/AZNFEhs+YE/inJm9xEqLBjDE/e9RPTWTMB94LMADZaR6ZudIipgAAAABJRU5ErkJggg==',
            iconSize: [20, 20],
        });
    }

    clearMarkers() {
        this.lastMarkers.forEach(m => m._icon.remove());
    }

    parseCoordinate(raw) {
        return parseInt(raw, 10) / 1000000.0;
    }

    renderMarker(train) {
        return L.marker([
            this.parseCoordinate(train.y),
            this.parseCoordinate(train.x)
        ], {
            icon: this.icon
        }).addTo(map);
    }

    render(dny) {
        this.clearMarkers();

        if (dny && dny.t) {
            this.lastMarkers = dny.t.map(train => this.renderMarker(train));
        }
    }
}
