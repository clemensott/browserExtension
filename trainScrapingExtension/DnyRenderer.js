class DnyRenderer {
    constructor(map, iconSize) {
        this.map = map;
        this.markers = new Map();
        this.icons = Object.entries(trainScrapingIconURLs).reduce((sum, [key, url]) => {
            sum[key] = L.icon({
                iconUrl: url,
                iconSize: [iconSize, iconSize],
            });
            return sum;
        }, {});

        this.newMarkers = 0;
    }

    getIcon(productClass) {
        return this.icons[productClass] || this.icons.default;
    }

    renderMarker(train) {
        const container = this.markers.get(train.i);
        if (container) {
            if (container.x !== train.x || container.y !== train.y) {
                container.marker.setLatLng([parseCoordinate(train.y), parseCoordinate(train.x)]);
                container.x = train.x;
                container.y = train.y;
            }
            if (container.c !== train.c) {
                container.marker.setIcon(this.getIcon(train.c));
                container.c = train.c;
            }
            if (!container.visable) {
                container.marker.setOpacity(1);
                container.visable = true;
            }
        } else {
            this.newMarkers++;
            this.markers.set(train.i, {
                y: train.y,
                x: train.x,
                c: train.c,
                visable: true,
                marker: L.marker(
                    [parseCoordinate(train.y), parseCoordinate(train.x)],
                    { icon: this.getIcon(train.c), }
                ).addTo(map),
            });
        }
    }

    render(dny) {
        this.newMarkers = 0;
        const start = Date.now();
        if (dny && dny.t) {
            const remainingHashIds = new Set(this.markers.keys());
            dny.t.forEach(train => {
                this.renderMarker(train);
                remainingHashIds.delete(train.i);
            });

            remainingHashIds.forEach(id => {
                const container = this.markers.get(id);
                if (container.visable) {
                    container.marker.setOpacity(0);
                    container.visable = false;
                }
            });
            // console.log('render infos:', {
            //     markers: this.markers.size,
            //     old: remainingHashIds.size,
            //     new: this.newMarkers,
            //     duration: Date.now() - start,
            // });
        }
    }

    garbageCollect() {
        [...this.markers.entries()].forEach(([key, { visable, marker }]) => {
            if (!visable) {
                removeCount++;
                marker._icon.remove();
                this.markers.delete(key);
            }
        });
    }
}
