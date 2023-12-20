import { getIconUrl } from '../services/icons';
import { createElement } from './components/createElement';
import './trainHistoryLegend.css';

function getIconText({ text, iconType, iconName, width, height }) {
    return {
        classList: ['ts-trains-legend-icon-text-container'],
        children: [
            {
                tag: 'img',
                src: getIconUrl(iconType, iconName),
                width,
                height,
            },
            {
                classList: ['ts-trains-legend-icon-text'],
                innerText: text,
            },
        ],
    };
}

function getProductClassIconText({ text, iconName }) {
    return getIconText({
        text,
        iconType: 'product',
        iconName,
        width: 25,
        height: 25,
    });
}

function getDalyIconText({ text, iconName }) {
    return getIconText({
        text,
        iconType: 'delay',
        iconName,
        width: 10,
        height: 10,
    });
}

export function createTrainHistoryLegend() {
    return createElement({
        classList: ['ts-trains-legend'],
        children: [
            {
                tag: 'b',
                innerText: 'Legende',
            },
            {
                classList: ['ts-trains-legend-part'],
                children: [
                    {
                        tag: 'label',
                        innerText: 'Verspäungen (innerer Kreis):',
                        classList: ['ts-trains-legend-header'],
                    },
                    getDalyIconText({ text: '<= 3 Minuten', iconName: 'green' }),
                    getDalyIconText({ text: '4 - 8 Minuten', iconName: 'yellow' }),
                    getDalyIconText({ text: '9 - 19 Minuten', iconName: 'orange' }),
                    getDalyIconText({ text: '20 - 44 Minuten', iconName: 'red' }),
                    getDalyIconText({ text: '45 - 119 Minuten', iconName: 'purple' }),
                    getDalyIconText({ text: '>= 120 Minuten', iconName: 'black' }),
                    getDalyIconText({ text: 'Unbekannt', iconName: 'whiteBlack' }),
                ],
            },
            {
                classList: ['ts-trains-legend-part'],
                children: [
                    {
                        tag: 'label',
                        innerText: 'Zugart (äußerer Kreis):',
                        classList: ['ts-trains-legend-header'],
                    },
                    getProductClassIconText({ text: 'RJ/RJX/ICE/TGV/...', iconName: 'darkred' }),
                    getProductClassIconText({ text: 'IC/EC/...', iconName: 'red' }),
                    getProductClassIconText({ text: 'D-Zug/Nachtzug/...', iconName: 'black' }),
                    getProductClassIconText({ text: 'Regionalzug', iconName: 'gray' }),
                    getProductClassIconText({ text: 'S-Bahn', iconName: 'lightblue' }),
                    getProductClassIconText({ text: 'Schienenersatzverkehr', iconName: 'orange' }),
                    getProductClassIconText({ text: 'Sonstiges', iconName: 'blue' }),
                ],
            },
        ]
    })
}