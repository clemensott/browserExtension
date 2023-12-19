import { createCheckbox } from './checkbox';

export function createCheckboxTree({ tree, marginLeft = true }) {
    let children = Array.isArray(tree.children)
        ? tree.children.map(child => createCheckboxTree({ tree: child, marginLeft: '15px' }))
        : [];

    return {
        ...createCheckbox({
            ...tree,
            marginLeft,
            children: children.map(c => c.element),
        }),
        children,
    };
}
