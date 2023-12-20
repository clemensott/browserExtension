import { createCheckboxTree } from './components/checkboxTree';
import { createElement } from './components/createElement';

function getTrainKey({ name, destination, trainId }) {
    return [
        name,
        destination,
        trainId,
    ].map(part => part ?? '').join('|');
}

function createTree({ trains, checkedCheckboxes, onChange }) {
    const root = [];
    trains.forEach(train => {
        let nameObj = root.find(t => t.name === train.name);
        if (!nameObj) {
            nameObj = {
                name: train.name,
                label: train.name,
                checked: false,
                onChange: e => onChange({ node: nameObj, checked: e.target.checked }),
                children: [],
            };
            nameObj.checked = checkedCheckboxes.has(getTrainKey(nameObj));
            root.push(nameObj);
        }

        let destinationObj = nameObj.children.find(t => t.destination === train.destination);
        if (!destinationObj) {
            destinationObj = {
                name: train.name,
                destination: train.destination,
                label: train.destination,
                checked: false,
                parent: nameObj,
                onChange: e => onChange({ node: destinationObj, checked: e.target.checked }),
                children: [],
            };
            destinationObj.checked = checkedCheckboxes.has(getTrainKey(destinationObj));
            nameObj.children.push(destinationObj);
        }

        const startTimestamp = train.data[0].time;
        const startTimeText = new Date(startTimestamp).toLocaleTimeString();
        const endTimestamp = train.data[train.data.length - 1].time;
        const endTimeText = new Date(endTimestamp).toLocaleTimeString();
        const trainIdObj = {
            name: train.name,
            destination: train.destination,
            trainId: train.trainId,
            train,
            label: `${startTimeText} - ${endTimeText} Uhr`,
            checked: false,
            parent: destinationObj,
            onChange: e => onChange({ node: trainIdObj, checked: e.target.checked }),
        };
        trainIdObj.checked = checkedCheckboxes.has(getTrainKey(trainIdObj));
        destinationObj.children.push(trainIdObj);
    });
    return root;
}

function connect(trees, containerTrees) {
    for (let i = 0; i < trees.length; i++) {
        trees[i].container = containerTrees[i];
        if (trees[i].children) {
            connect(trees[i].children, containerTrees[i].children);
        }
    }
}

function getCheckedTrains(trees, isBranchChecked = false) {
    return trees.flatMap(tree => {
        const checked = isBranchChecked || tree.container.getChecked();
        if (tree.children?.length) {
            return getCheckedTrains(tree.children, checked);
        }
        return checked ? [tree.train] : [];
    });
}

function excludeTrains(allTrains, excludeTrains) {
    return [...allTrains.keys()].filter(key => !excludeTrains.has(key)).map(key => allTrains.get(key));
}

export function createTrainListTree({ onSelectionChange }) {
    let treeRoots = [];
    const checkedCheckboxes = new Set();
    const checkedTrains = new Map();

    const trainsContainer = createElement();
    const div = createElement({
        children: [
            {
                tag: 'label',
                innerText: 'Trains',
            },
            trainsContainer,
        ],
    });

    function triggerSelectionChange(reset = false) {
        const lastCheckedTrains = new Map(checkedTrains.entries());
        checkedTrains.clear();
        getCheckedTrains(treeRoots).forEach(train => checkedTrains.set(getTrainKey(train), train));
        onSelectionChange({
            selectedTrains: [...checkedTrains.values()],
            addedTrains: reset ? [...checkedTrains.values()] : excludeTrains(checkedTrains, lastCheckedTrains),
            removedTrains: reset ? [...lastCheckedTrains.values()] : excludeTrains(lastCheckedTrains, checkedTrains),
        });
    }

    function onChange({ node, checked }) {
        const key = getTrainKey(node);
        if (checked) {
            checkedCheckboxes.add(key);
        } else {
            checkedCheckboxes.delete(key);
        }
        triggerSelectionChange();
    }

    function updateTrains(trains) {
        if (trains.length) {
            treeRoots = createTree({
                trains,
                checkedCheckboxes,
                onChange,
            });

            const rootElements = treeRoots.map(root => createCheckboxTree({ tree: root }));
            connect(treeRoots, rootElements);

            trainsContainer.innerHTML = '';
            rootElements.forEach(({ element }) => trainsContainer.appendChild(element));
        } else {
            treeRoots = [];
            trainsContainer.innerText = 'Nothing to select';
        }

        triggerSelectionChange(true);
    }

    updateTrains([]);

    return {
        element: div,
        updateTrains,
        getSelectedTrains: () => [...checkedTrains.values()],
    };
}
