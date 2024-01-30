console.log('Hello sub:', !!window.isTop, window.location.href);

let lastEvent = null;
let elementsBackgroundColors = {};

browser.runtime.onMessage.addListener((msg) => {
    switch (msg.type) {
        case 'change_highlight_element':
            handleHighlight(msg.data.elementId, msg.data.type);
            break;

        case 'hide_element':
            handleHighlight(msg.data.elementId, 'unlight');
            handleHide(msg.data.elementId, msg.data.type);
            break;

        case 'element_infos':
            if (msg.data.elements.every(e => e.src !== window.location.href)) {
                const lastSrc = msg.data.elements.length && msg.data.elements[msg.data.elements.length - 1].src;
                const frames = document.querySelectorAll('iframe');
                const element = [...frames].find(f => f.src === lastSrc);
                if (element) {
                    sendElementInfos(msg.data.elements, element, window);
                }
            }
            break;
    }

    return false;
});

function handleHighlight(elementId, type) {
    if (lastEvent && lastEvent.localElements && lastEvent.localElements.has(elementId)) {
        const element = lastEvent.localElements.get(elementId);
        if (type === 'highlight') {
            elementsBackgroundColors[elementId] = element.style['background-color'];
            element.style['background-color'] = 'green';
        }
        else if (type === 'unlight') {
            element.style['background-color'] = elementsBackgroundColors[elementId];
        }
    }
}

function handleHide(elementId, type) {
    if (lastEvent && lastEvent.localElements && lastEvent.localElements.has(elementId)) {
        const element = lastEvent.localElements.get(elementId);
        if (type === 'hide') element.style.display = 'none';
        else if (type === 'remove') element.remove();
    }
}

function getRandomId() {
    return `${Date.now()}_${Math.random()}`;
}

function sendElementInfos(current, element, win) {
    const newElements = [];
    while (element) {
        newElements.push(element);
        element = element.parentElement;
    }

    console.debug('new elements:', newElements);

    const localElementsMap = new Map();
    lastEvent = {
        type: 'element_infos',
        data: {
            elements: current.concat(newElements.map(e => {
                const elementId = getRandomId();
                localElementsMap.set(elementId, e);
                return {
                    src: win.location.href,
                    elementId,
                    tagName: e.tagName,
                    innerText: e.innerText,
                    classList: e.classList ? [...e.classList] : [],
                    clientWidth: e.clientWidth,
                    clientHeight: e.clientHeight,
                };
            })),
        },
        localElements: localElementsMap,
    };
    browser.runtime.sendMessage({
        type: lastEvent.type,
        data: lastEvent.data,
    });
}

function addContextMenuListener(win) {
    win.addEventListener('contextmenu', e => {
        console.debug('contextmenu e:', e)
        if (e.target) {
            sendElementInfos([], e.target, win);
        }
    });
}

addContextMenuListener(window);
