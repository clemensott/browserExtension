import { addDays } from '../utils/addDays';
import { formatIsoDate } from '../utils/formatIsoDate';
import { normalizeTrainName } from '../utils/normalizeTrainName';
import { createElement } from './components/createElement';
import { createDatePicker } from './components/datePicker';
import { createFormGroup } from './components/formGroup';
import { createSelect } from './components/select';
import { createSidebarSection } from './components/sidebarSection';
import { createTrainHistoryLegend } from './trainHistoryLegend';
import { createTrainListTree } from './trainsListTree';

function filterTrainDataForDate(trainData, date) {
    const dateString = formatIsoDate(date);
    return trainData.map(train => ({
        name: train.name,
        destination: train.destination,
        trainId: train.trainId,
        data: train.data.filter(entry => entry.date === dateString),
    })).filter(t => t.data.length);
}

function getTrainKey({ name, destination }) {
    return `${name}|${destination}`;
}

export function createTrainHistory({ api, onTrainSelectionChange }) {
    let trainNameSearchId = 0;
    let groupedTrainDestinations = new Map();
    const trainsData = new Map();

    const lastDaysInput = createElement({
        tag: 'input',
        id: 'last-days',
        type: 'number',
        value: 30,
        min: 0,
        step: 1,
        onBlur: onDaysChanged,
    });

    const datePicker = createDatePicker({
        value: addDays(new Date(), -1),
        min: addDays(new Date(), -getSelectedDays()),
        max: new Date(),
        onChange: updateTrainsTree,
    });

    const trainsListTree = createTrainListTree({
        onSelectionChange: onTrainSelectionChange,
    });

    const sidebar = createSidebarSection({
        title: 'Trains',
        children: [
            createFormGroup({
                label: 'Last (Days)',
                input: lastDaysInput,
            }),
            createFormGroup({
                label: 'Train Names',
                input: createSelect({
                    id: 'train-names',
                    multiple: true,
                    options: [],
                    onChange: updateTrainDestinations,
                }),
            }),
            createFormGroup({
                label: 'Train Destinations',
                input: createSelect({
                    id: 'train-destinations',
                    multiple: true,
                    onChange: updateTrainsData,
                }),
            }),
            createFormGroup({
                label: 'Date',
                input: datePicker.element,
            }),
            trainsListTree.element,
            createTrainHistoryLegend(),
        ],
    });

    document.querySelector('#sideBar').appendChild(sidebar);

    const trainNamesSelect = new vanillaSelectBox('#train-names', {
        search: true,
        disableSelectAll: true,
        itemsSeparator: ', ',
        remote: {
            onSearch: searchTrainNames,
        },
    });

    const trainDestinationsSelect = new vanillaSelectBox('#train-destinations', {
        search: true,
        itemsSeparator: ', ',
    });

    function getSelectedDays() {
        return Number.parseInt(lastDaysInput.value) || 0;
    }

    function onDaysChanged() {
        trainsData.clear();
        datePicker.setMin(addDays(new Date(), -getSelectedDays()));
        updateTrainDestinations();
        updateTrainsData();
    }

    function getSelectedTrainNames() {
        return [...trainNamesSelect.root.selectedOptions].map(o => o.value);
    }

    async function searchTrainNames(searchValue) {
        const searchId = ++trainNameSearchId;
        const names = await api.searchTrainNames({
            needle: searchValue,
            start: `-${getSelectedDays()}d`,
        });
        if (searchId !== trainNameSearchId) {
            return Promise.reject('Different Search in progess');
        }
        return names.map(name => ({ value: name, text: normalizeTrainName(name) }));
    }

    function getSelectedTrainDestinations() {
        return [...trainDestinationsSelect.root.selectedOptions].map(o => o.value);
    }

    async function searchTrainDestinations() {
        const trains = await api.getTrainDestinations({
            trainNames: getSelectedTrainNames().filter(Boolean),
            start: `-${getSelectedDays()}d`,
        });
        groupedTrainDestinations = trains.reduce((map, train) => {
            if (!map.has(train.destination)) {
                map.set(train.destination, []);
            }
            map.get(train.destination).push(train);
            return map;
        }, new Map());
        return [...groupedTrainDestinations.keys()].map(destination => ({ value: destination, text: destination }));
    }

    async function updateTrainDestinations() {
        const destinations = await searchTrainDestinations();
        const selected = new Set(getSelectedTrainDestinations());
        trainDestinationsSelect.changeTree(destinations.map(dest => ({
            ...dest,
            selected: selected.has(dest.value),
        })));
    }

    function getSelectedTrainNamesAndDestinations() {
        return getSelectedTrainDestinations().flatMap(dest => groupedTrainDestinations.get(dest))
    }

    async function updateTrainsData() {
        const trains = getSelectedTrainNamesAndDestinations();
        await trains.reduce(async (promise, train) => {
            await promise;
            const key = getTrainKey(train);
            if (!trainsData.has(key)) {
                const trainData = await api.getTrainData({ trains: [train], start: `-${getSelectedDays()}d` });
                trainsData.set(key, trainData);
            }
        }, Promise.resolve());

        updateTrainsTree();
    }

    function updateTrainsTree() {
        const trains = getSelectedTrainNamesAndDestinations();
        const selectedTrainsData = trains.flatMap(train => trainsData.get(getTrainKey(train))).filter(Boolean);
        const dateTrainsData = filterTrainDataForDate(selectedTrainsData, datePicker.getSelectedDate());
        const sortedTrainsData = dateTrainsData.sort((a, b) => a.data[0].time.localeCompare(b.data[0].time));
        trainsListTree.updateTrains(sortedTrainsData);
    }
}
