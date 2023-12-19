import { createElement } from "./createElement";

function appendOptions({ select, options, selectedValues }) {
    if (Array.isArray(options)) {
        const selectedValuesSet = new Set(selectedValues ?? []);
        options.forEach(o => {
            let value;
            let text;
            let selected = null;
            if (typeof o === 'object') {
                value = o.value;
                text = o.text;
                selected = o.selected;
            } else {
                value = o;
                text = o;
            }

            select.appendChild(createElement({
                tag: 'option',
                value,
                innerText: text,
                selected: selected ?? selectedValuesSet.has(value),
            }));
        });
    }
}

export function createSelect({ id, options, selectedValues, multiple, onChange }) {
    const select = createElement({
        tag: 'select',
        id,
        multiple,
        onChange,
    });

    appendOptions({ select, options, selectedValues });

    return select;
}

export function updateSelect(select, { clear = true, options, selectedValues, multiple }) {
    if (multiple) {
        select.multiple = multiple;
    }

    if (clear) {
        select.innerHTML = '';
    }

    appendOptions({ select, options, selectedValues });
}
