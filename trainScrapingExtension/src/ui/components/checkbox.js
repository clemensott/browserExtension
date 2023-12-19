import { randomString } from '../../utils/randomString';
import { createElement } from './createElement';

export function createCheckbox({ label, checked, disabled, marginLeft, children, onChange }) {
    const checkboxId = randomString(20);
    const checkbox = createElement({
        tag: 'input',
        type: 'checkbox',
        id: checkboxId,
        flags: {
            checked,
            disabled,
        },
        onChange,
    });
    const div = createElement({
        style: {
            marginLeft,
        },
        children: [
            checkbox,
            {
                tag: 'label',
                for: checkboxId,
                innerText: label,
            },
            ...children,
        ],
    })

    return {
        element: div,
        getChecked: () => checkbox.checked,
        setChecked: c => checkbox.checked = c,
    };
}
