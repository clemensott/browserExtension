let lastInfos = null;
let lastModalContainer = null;

chrome.runtime.onMessage.addListener((msg) => {
    // console.log('main message:', msg);
    if (msg.type === 'show_hide_element_modal' && lastInfos) {
        showModal(lastInfos.elements);
    } else if (msg.type === 'element_infos' && (!lastModalContainer || !lastModalContainer.parentElement)) {
        lastInfos = msg.data;
    }
});

function sendHideMessage(elementId, type) {
    chrome.runtime.sendMessage({
        type: 'hide_element',
        data: {
            type,
            elementId,
        },
    });
}

function sendHighlightElementMessage(elementId, type) {
    chrome.runtime.sendMessage({
        type: 'change_highlight_element',
        data: {
            type,
            elementId,
        },
    });
}


function showModal(elements) {
    if (elements.some(e => e && e.id === 'hide_elments_modal_container')) return;
    if (lastModalContainer) {
        lastModalContainer.remove();
        lastModalContainer = null;
    }

    const elementTemplates = elements.map((node, i) => node && node.tagName ? {
        tagName: 'div',
        style: {
            display: 'flex',
            margin: '5px',
            'flex-direction': 'column',
        },
        onmouseenter: () => sendHighlightElementMessage(node.elementId, 'highlight'),
        onmouseleave: () => sendHighlightElementMessage(node.elementId, 'unlight'),
        children: [{
            tagName: 'div',
            style: {
                display: 'flex',
            },
            children: [{
                tagName: 'div',
                style: {
                    'flex-grow': 2,
                    'font-weight': 'bold',
                },
                innerText: getElementDescription(node),
            }, {
                tagName: 'button',
                style: {
                    'margin-left': '20px',
                    'margin-right': '10px',
                },
                innerText: 'hide',
                onclick: () => {
                    sendHideMessage(node.elementId, 'hide');
                    showModal(elements.map((mapNode, mapIndex) => mapIndex > i ? mapNode : null));
                },
            }, {
                tagName: 'button',
                innerText: 'delete',
                onclick: () => {
                    sendHideMessage(node.elementId, 'remove');
                    showModal(elements.map((mapNode, mapIndex) => mapIndex > i ? mapNode : null));
                },
            }]
        }, node.innerText ? {
            tagName: 'div',
            style: {
                'font-style': 'italic',
            },
            innerText: getElementText(node),
        } : null],
    } : null).filter(Boolean);
    if (!elementTemplates.length) {
        return;
    }

    const allElements = [...document.body.getElementsByTagName("*")];
    const maxZIndex = Math.max(...allElements.map(e => getComputedStyle(e)['z-index']).map(Number).filter(Boolean));
    console.log('z index:', maxZIndex);
    const modalContainer = buildDomElement({
        tagName: 'div',
        id: 'hide_elments_modal_container',
        style: {
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            'z-index': Math.max(maxZIndex + 1, 1000000),
            display: 'flex',
            'flex-direction': 'column',
            'justify-content': 'center',
            'align-items': 'center',
        },
        onclick: e => {
            if (e.target === modalContainer) {
                modalContainer.remove();
            }
        },
        children: [{
            tagName: 'div',
            style: {
                'background-color': 'white',
                padding: '20px',
                'min-width': '500px',
                border: '2px solid black',
                opacity: '0.9'
            },
            children: [{
                tagName: 'button',
                innerText: 'close',
                style: {
                    float: 'right',
                    top: 0,
                    right: 0,
                },
                onclick: () => modalContainer.remove(),
            }, {
                tagName: 'div',
                style: {
                    'text-align': 'center',
                },
                children: [{
                    tagName: 'h2',
                    innerText: 'What to delete?',
                }]
            }, {
                tagName: 'div',
                children: elementTemplates,
            }]
        }]
    })

    document.body.appendChild(modalContainer);

    lastModalContainer = modalContainer;
}

function buildDomElement({ tagName, style, children, ...rest }) {
    const element = document.createElement(tagName);
    if (style) {
        Object.keys(style).forEach(key => element.style[key] = style[key]);
    }

    Object.keys(rest).forEach(key => element[key] = rest[key]);

    if (Array.isArray(children)) {
        children.filter(Boolean).forEach(child => element.appendChild(buildDomElement(child)));
    }

    return element;
}

function getElementDescription(node) {
    return `${node.tagName}${[...node.classList].map(c => `.${c}`).join('').substring(0, 50)} (${node.clientWidth}x${node.clientHeight})`;
}

function getElementText(node) {
    return node.innerText.split('\n').filter(Boolean)[0].substring(0, 70);
}