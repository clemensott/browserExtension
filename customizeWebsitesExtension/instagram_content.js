function getLoginOverlay() {
    let element = document.querySelector("a[href='/accounts/password/reset/']");
    while (element && element.parentNode != document.body) {
        element = element.parentNode;
    }
    return element;
}

let removedLoginOverlay = false;
const loginOverlayIntervalId = setInterval(() => {
    const overlayBaseElement = getLoginOverlay();
    if (overlayBaseElement) {
        overlayBaseElement.remove();
        removedLoginOverlay = true;
    }
    if (removedLoginOverlay && document.body.style.overflow) {
        document.body.style.overflow = null;
        clearInterval(loginOverlayIntervalId);
    }
}, 100);

// The div element that lies over the main image to avoid downloading
function getMainImageOverlay() {
    const overlay = document.querySelector("div > div[role=button] > div > div > div:nth-child(2)");
    return overlay &&
        overlay.parentNode.children[0] &&
        overlay.parentNode.children[0].children[0] &&
        overlay.parentNode.children[0].children[0].tagName === 'IMG' ? overlay : null;
}

const mainImageOverlayIntervalId = setInterval(() => {
    const overlayElement = getMainImageOverlay();
    if (overlayElement) {
        overlayElement.remove();
        clearInterval(mainImageOverlayIntervalId);
    }
}, 100);