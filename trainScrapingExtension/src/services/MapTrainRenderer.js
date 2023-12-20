import { parseCoordinate } from "../utils/parseCoordinate";
import { InsiteCommunicator } from "./InsiteCommunicator";
import { getIconUrl } from "./icons";

function getProductClassIconName(productClass) {
    switch (productClass) {
        case 2:
            return 'darkred';
        case 4:
            return 'red';
        case 8:
            return 'black';
        case 16:
            return 'gray';
        case 32:
            return 'lightblue';
        default:
            return 'orange';
    }
}

function getDelayIconName(delay) {
    if (typeof delay !== 'number') {
        return 'white';
    } else if (delay < 4) {
        return 'green';
    } else if (delay < 10) {
        return 'yellow';
    } else if (delay < 25) {
        return 'orange';
    } else if (delay < 60) {
        return 'red';
    } else {
        return 'black';
    }
}

function getTrainKey({ name, destination, trainId }) {
    return [
        name,
        destination,
        trainId,
    ].map(part => part ?? '').join('|');
}

export class MapTrainRenderer {
    constructor(map, iconSize = 10, iconShadowSize = 25) {
        this.map = map;
        this.iconSize = iconSize;
        this.iconShadowSize = iconShadowSize;
        this.icons = new Map();
        this.markers = new Map();
        this.insiteCommunicator = new InsiteCommunicator('MapTrainRenderer');
    }

    createIcon(productClassName, delayName) {
        return L.icon({
            iconUrl: getIconUrl('delay', delayName),
            iconSize: [this.iconSize, this.iconSize],
            shadowUrl: getIconUrl('product', productClassName),
            shadowSize: [this.iconShadowSize, this.iconShadowSize],
        });
    }

    getIcon(productClass, delay) {
        const productClassName = getProductClassIconName(productClass);
        const delayName = getDelayIconName(delay);
        const key = `${productClassName}|${delayName}`;
        if (!this.icons.has(key)) {
            this.icons.set(key, this.createIcon(productClassName, delayName));
        }

        return this.icons.get(key);
    }

    renderMarker(train, entry) {
        const { name, destination } = train;
        const { lat, long, product_class: productClass, delay, time } = entry;
        const marker = L.marker(
            [parseCoordinate(long), parseCoordinate(lat)],
            {
                title: `${name} -> ${destination} (delay: ${delay ?? '?'} min) (at ${time})`,
                icon: this.getIcon(productClass, delay),
            }
        ).addTo(map);

        const key = getTrainKey(train);
        if (!this.markers.has(key)) {
            this.markers.set(key, []);
        }
        this.markers.get(key).push(marker);
    }

    renderTrain(train) {
        train.data.forEach(d => this.renderMarker(train, d));
    }

    init() {
        this.insiteCommunicator.addMessageListener(this.onTrains.bind(this));
    }

    onTrains({ detail: { addedTrains, removedTrains } }) {
        removedTrains.forEach(train => {
            const key = getTrainKey(train);
            this.markers.get(key).forEach(marker => marker.onRemove(this.map));
            this.markers.delete(key);
        });

        addedTrains.forEach(train => this.renderTrain(train));
    }

    sendTrains(trains) {
        this.insiteCommunicator.sendMessage(trains);
    }
}
