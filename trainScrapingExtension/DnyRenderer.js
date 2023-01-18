class DnyRenderer {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.usedMarkers = 0;
        this.icons = Object.entries(trainScrapingIconURLs).reduce((sum, [key, url]) => {
            sum[key] = L.icon({
                iconUrl: url,
                iconSize: [20, 20],
            });
            return sum;
        }, {});
    }

    getIcon(productClass) {
        return this.icons[productClass] || this.icons.default;
    }

    setLatLng(trains, index) {
        const train = trains[index];
        this.markers[index].setLatLng([parseCoordinate(train.y), parseCoordinate(train.x)]);
        this.markers[index].setIcon(this.getIcon(train.c));
        if (index >= this.usedMarkers) {
            this.markers[index].setOpacity(1);
        }
    }

    renderMarker(train) {
        return L.marker([
            parseCoordinate(train.y),
            parseCoordinate(train.x)
        ], {
            icon: this.getIcon(train.c),
        }).addTo(map);
    }

    render(dny) {
        const start = Date.now();
        if (dny && dny.t) {
            const minCount = Math.min(dny.t.length, this.markers.length);
            for (let i = 0; i < minCount; i++) {
                this.setLatLng(dny.t, i);
            }

            for (let i = minCount; i < dny.t.length; i++) {
                this.markers.push(this.renderMarker(dny.t[i]));
            }

            for (let i = minCount; i < this.usedMarkers; i++) {
                this.markers[i].setOpacity(0);
            }

            this.usedMarkers = dny.t.length;
        }
        // console.log('render millis:', Date.now() - start);
    }
}
