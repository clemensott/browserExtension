import { addDays } from '../../utils/addDays';
import { formatIsoDate } from '../../utils/formatIsoDate';
import { createElement } from './createElement';

export function createDatePicker({ value, min, max, onChange }) {
    const previousDayButton = createElement({
        tag: 'button',
        innerText: '<',
        flags: {
            disabled: (value && formatIsoDate(value)) === (min && formatIsoDate(min)),
        },
    });
    const datePicker = createElement({
        tag: 'input',
        type: 'date',
        value: value && formatIsoDate(value),
        min: min && formatIsoDate(min),
        max: max && formatIsoDate(max),
        onChange,
    });
    const nextDayButton = createElement({
        tag: 'button',
        innerText: '>',
        flags: {
            disabled: (value && formatIsoDate(value)) === (max && formatIsoDate(max)),
        },
    });

    function changeDate(offsetDays) {
        datePicker.value = formatIsoDate(addDays(datePicker.value, offsetDays));
        const event = new UIEvent('change', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        datePicker.dispatchEvent(event);
    }

    datePicker.addEventListener('change', () => {
        previousDayButton.disabled = datePicker.value <= datePicker.min;
        nextDayButton.disabled = datePicker.value >= datePicker.max;
    });
    previousDayButton.addEventListener('click', () => changeDate(-1));
    nextDayButton.addEventListener('click', () => changeDate(1));

    return {
        element: createElement({
            children: [
                previousDayButton,
                datePicker,
                nextDayButton,
            ]
        }),
        getSelectedDate: () => new Date(datePicker.value),
        setMin: min => datePicker.min = formatIsoDate(min),
        setMax: max => datePicker.max = formatIsoDate(max),
    };
}
