import { createElement } from './createElement';
import './sidebarSection.css';

export function createSidebarSection({ title, children }) {
    return createElement({
        classList: ['sidebar-section'],
        children: [
            {
                tag: 'b',
                innerText: title,
            },
            ...children,
        ]
    });
}
