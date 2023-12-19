export function createInput({ id, name, type, value, min, max, step, placeholder, onChange, onBlur }) {
    const input = document.createElement('input');

    Object.entries({
        id, name, type, value, min, max, step, placeholder, onChange, onBlur,
    }).forEach(([key, value]) => value !== undefined && (input[key] = value));

    return input;
}
