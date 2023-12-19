import { addDays } from '../utils/addDays';
import { formatIsoDate } from '../utils/formatIsoDate';
import { createElement } from './components/createElement';
import { createDatePicker } from './components/datePicker';
import { createFormGroup } from './components/formGroup';
import { createSelect } from './components/select';
import { createSidebarSection } from './components/sidebarSection';
import { createTrainListTree } from './trainsListTree';

function groupTrainData(trainData, date) {
    const dateString = formatIsoDate(date);
    return trainData.flatMap(train => {
        const grouped = train.data.filter(entry => entry.date === dateString).reduce((map, entry) => {
            if (!map.has(entry.train_id)) {
                map.set(entry.train_id, []);
            }
            map.get(entry.train_id).push(entry);
            return map;
        }, new Map());

        return [...grouped].map(([trainId, data]) => ({
            name: train.name,
            destination: train.destination,
            trainId,
            data,
        }));
    });
}

export function createTrainHistory({ api, onTrainSelectionChange }) {
    let trainNameSearchId = 0;
    let groupedTrainDestinations = new Map();
    let trainsData = [];

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
        value: new Date(),
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
                    options: [{
                        value: '',
                        text: 'Enter search term',
                    }],
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
        return names.map(name => ({ value: name, text: name }));
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

    async function updateTrainsData() {
        const trains = getSelectedTrainDestinations().flatMap(dest => groupedTrainDestinations.get(dest));
        trainsData = await api.getTrainData({ trains, start: `-${getSelectedDays()}d` });
        updateTrainsTree();
    }

    function updateTrainsTree() {
        trainsListTree.updateTrains(groupTrainData(trainsData, datePicker.getSelectedDate()));
    }
}
