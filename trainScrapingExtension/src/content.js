import './services/icons';
import { Api } from './services/Api';
import { createTrainHistory } from './ui/trainHistory';
import { importCode } from './utils/import';
import { MapTrainRenderer } from './services/MapTrainRenderer';


const api = new Api({
    url: 'https://influx-trains.clemensott.com',
    org: 'ott',
    token: 'anq3I2qbwOBx8WW9PmPkdV9ZK-2BgbTSLzaYvn5GYInqzEmdkKPqoQAXe69KKxKduPGqeNo8zPNVt7Cy-ZUtKA==',
});

async function importInsite() {
    const url = chrome.runtime.getURL('insite.js');
    console.log('insite:', url)
    const response = await fetch(url);
    const code = await response.text();

    importCode(code);
}

async function main() {
    console.log('ping:', await api.ping());

    importInsite();

    const mapTrainRenderer = new MapTrainRenderer();
    createTrainHistory({
        api,
        onTrainSelectionChange: e => mapTrainRenderer.sendTrains(e.selectedTrains),
    });
}

main();
