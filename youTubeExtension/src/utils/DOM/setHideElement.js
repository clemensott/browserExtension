import './setHideElement.css';

const hideAttribute = 'yt-extension-hide-element';

export function setHidden(element) {
    element.setAttribute(hideAttribute, '');
}

export function setVisable(element) {
    element.removeAttribute(hideAttribute);
}
