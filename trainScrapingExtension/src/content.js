import './services/icons';
import { createTrainHistory } from './ui/trainHistory';
import { importCode } from './utils/import';
import { MapTrainRenderer } from './services/MapTrainRenderer';
import { createApi } from './utils/createApi';


async function importInsite() {
    const url = chrome.runtime.getURL('insite.js');
    const response = await fetch(url);
    const code = await response.text();

    importCode(code);
}

async function main() {
    const api = createApi();
    if (!api || !await api.ping()) {
        return;
    }

    importInsite();

    const mapTrainRenderer = new MapTrainRenderer();
    createTrainHistory({
        api,
        onTrainSelectionChange: e => mapTrainRenderer.sendTrains(e),
    });
}

main();
