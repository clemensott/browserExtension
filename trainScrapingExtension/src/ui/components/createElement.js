function getEntries(obj) {
    return Object.entries(obj)
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => ({ name, value }));
}

function correctStyleName(name) {
    let correctName = '';
    for (let i = 0; i < name.length; i++) {
        const char = name.charAt(i);
        if (char.charCodeAt(0) >= 65 && char.charCodeAt(0) <= 90) {
            correctName += '-' + char.toLowerCase();
        } else correctName += char;
    }

    return correctName;
}

export function toAttributeFlagValue(value) {
    return value ? '' : undefined;
}

export function createElement({ tag = 'div', innerText, innerHTML, classList = [], style = {}, data = {}, children = [], flags = {}, ...rest } = {}) {
    const element = document.createElement(tag);
    if (innerText) {
        element.innerText = innerText;
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    getEntries(rest).forEach(({ name, value }) => {
        if (name.startsWith('on')) {
            element.addEventListener(name.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(name, value ?? '');
        }
    });
    if (flags) {
        getEntries(flags).forEach(({ name, value }) => value && element.setAttribute(name, ''));
    }
    if (Array.isArray(classList) && classList.length) {
        element.classList.add(...classList);
    }
    if (style) {
        getEntries(style).forEach(({ name, value }) => element.style.setProperty(correctStyleName(name), value));
    }
    if (data) {
        getEntries(data).forEach(({ name, value }) => element.dataset[name] = value);
    }
    if (Array.isArray(children)) {
        children.forEach(child => element.appendChild(child instanceof Node ? child : createElement(child)));
    }

    return element;
}
