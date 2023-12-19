import { createElement } from './createElement';
import './formGroup.css';

export function createFormGroup({ label, input }) {
    return createElement({
        classList: ['form-group'],
        children: [
            {
                tag: 'label',
                innerText: label,
            },
            input,
        ],
    });
}
