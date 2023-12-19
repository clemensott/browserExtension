import { createCheckboxTree } from './components/checkboxTree';
import { createElement } from './components/createElement';

function getTrainKey({ name, destination, trainId }) {
    return [
        name,
        destination,
        trainId,
    ].join('|');
}

function createTree({ trains, checkedTrains, onNameChange, onDestinationChange, onTrainIdChange }) {
    const root = [];
    trains.forEach(train => {
        const checked = checkedTrains.has(getTrainKey(train));

        let nameObj = root.find(t => t.name === train.name);
        if (!nameObj) {
            nameObj = {
                name: train.name,
                label: train.name,
                checked: true,
                disabled: true,
                onChange: e => onNameChange({ node: nameObj, checked: e.target.checked }),
                children: [],
            };
            root.push(nameObj);
        }
        nameObj.checked = nameObj.checked && checked;
        nameObj.disabled = nameObj.disabled && train.disabled;

        let destinationObj = nameObj.children.find(t => t.destination === train.destination);
        if (!destinationObj) {
            destinationObj = {
                destination: train.destination,
                label: train.destination,
                checked: true,
                disabled: true,
                parent: nameObj,
                onChange: e => onDestinationChange({ node: destinationObj, checked: e.target.checked }),
                children: [],
            };
            nameObj.children.push(destinationObj);
        }
        destinationObj.checked = destinationObj.checked && checked;
        destinationObj.disabled = destinationObj.disabled && train.disabled;

        const trainIdObj = {
            train,
            label: train.trainId,
            checked,
            disabled: train.disabled,
            parent: destinationObj,
            onChange: e => onTrainIdChange({ node: trainIdObj, checked: e.target.checked }),
        };
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

function setBranchChecked(branch, checked) {
    branch.setChecked(checked);
    if (branch.children) {
        branch.children.forEach(child => setBranchChecked(child, checked));
    }
}

function updateChecked(branch) {
    if (branch.children?.length) {
        const allChecked = branch.children.map(updateChecked).every(Boolean);
        branch.setChecked(allChecked);
    }
    return branch.getChecked();
}

function getCheckedTrains(trees) {
    return trees.flatMap(tree => {
        if (tree.children?.length) {
            return getCheckedTrains(tree.children);
        }
        return tree.container.getChecked() ? [tree.train] : [];
    });
}

export function createTrainListTree({ onSelectionChange }) {
    let treeRoots = [];
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

    function triggerSelectionChange() {
        checkedTrains.clear();
        getCheckedTrains(treeRoots).forEach(train => checkedTrains.set(getTrainKey(train), train));
        onSelectionChange({
            selectedTrains: [...checkedTrains.values()],
        });
    }

    function onNameChange({ node, checked }) {
        setBranchChecked(node.container, checked);
        triggerSelectionChange();
    }

    function onDestinationChange({ node, checked }) {
        setBranchChecked(node.container, checked);
        updateChecked(node.parent.container);
        triggerSelectionChange();
    }

    function onTrainIdChange({ node }) {
        updateChecked(node.parent.parent.container);
        triggerSelectionChange();
    }

    function updateTrains(trains) {
        if (trains.length) {
            treeRoots = createTree({
                trains,
                checkedTrains,
                onNameChange,
                onDestinationChange,
                onTrainIdChange,
            });

            const rootElements = treeRoots.map(root => createCheckboxTree({ tree: root }));
            connect(treeRoots, rootElements);

            trainsContainer.innerHTML = '';
            rootElements.forEach(({ element }) => trainsContainer.appendChild(element));
        } else {
            treeRoots = [];
            trainsContainer.innerText = 'Nothing to select';
        }

        triggerSelectionChange();
    }

    updateTrains([]);

    return {
        element: div,
        updateTrains,
        getSelectedTrains: () => [...checkedTrains.values()],
    };
}
