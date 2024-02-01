import { normalizeTrainName } from '../utils/normalizeTrainName';
import { parseCoordinate } from '../utils/parseCoordinate';
import { InsiteCommunicator } from './InsiteCommunicator';
import { getIconUrl } from './icons';

function getProductClassIconName(productClass) {
    switch (productClass) {
        case 1:
            return 'darkred';
        case 2:
            return 'orange';
        case 4:
            return 'red';
        case 8:
            return 'black';
        case 16:
            return 'gray';
        case 32:
            return 'lightblue';
        default:
            return 'blue';
    }
}

function getDelayIconName(delay) {
    if (typeof delay !== 'number') {
        return 'white';
    } else if (delay < 4) {
        return 'green';
    } else if (delay < 9) {
        return 'yellow';
    } else if (delay < 20) {
        return 'orange';
    } else if (delay < 45) {
        return 'red';
    } else if (delay < 120) {
        return 'purple';
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
        const delayText = typeof delay === 'number' ? `(delay: ${delay} min) ` : '';
        const timeText = new Date(time).toLocaleTimeString();
        const marker = L.marker(
            [parseCoordinate(long), parseCoordinate(lat)],
            {
                title: `${normalizeTrainName(name)} -> ${destination} ${delayText}(at ${timeText})`,
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

    onTrains({ detail }) {
        const { addedTrains, removedTrains } = JSON.parse(detail);
        removedTrains.forEach(train => {
            const key = getTrainKey(train);
            this.markers.get(key).forEach(marker => marker.onRemove(this.map));
            this.markers.delete(key);
        });

        addedTrains.forEach(train => this.renderTrain(train));
    }

    sendTrains(trains) {
        this.insiteCommunicator.sendMessage(JSON.stringify(trains));
    }
}
