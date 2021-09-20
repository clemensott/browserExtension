const intervalIds = {};
let lastUrl = null;



function clearIntervalByName(name) {
    console.log('clear interval by name:', name, intervalIds[name]);
    if (intervalIds[name]) {
        clearInterval(intervalIds[name]);
        delete intervalIds[name];
    }
}

function clearAllIntervals() {
    Object.keys(intervalIds).forEach(clearIntervalByName);
}

function setupInterval(intervalName, callback, timeout) {
    intervalIds[intervalName] = setInterval(callback, timeout, intervalName);
}

function setupIntervals() {
    function getLoginOverlay() {
        let element = document.querySelector("a[href='/accounts/password/reset/']");
        while (element && element.parentNode != document.body) {
            element = element.parentNode;
        }
        return element;
    }

    if (!window.location.href.startsWith('https://www.instagram.com/accounts/login')) {
        let removedLoginOverlay = false;
        setupInterval('loginInterval', intervalName => {
            const overlayBaseElement = getLoginOverlay();
            if (overlayBaseElement) {
                overlayBaseElement.remove();
                removedLoginOverlay = true;
            }
            if (removedLoginOverlay && document.body.style.overflow) {
                document.body.style.overflow = null;
                clearIntervalByName(intervalName);
            }
        }, 100);
    }

    // The div element that lies over the main image to avoid downloading
    function getMainImageOverlay() {
        const overlay = document.querySelector("div > div[role=button] > div > div > div:nth-child(2)");
        return overlay &&
            overlay.parentNode.children[0] &&
            overlay.parentNode.children[0].children[0] &&
            overlay.parentNode.children[0].children[0].tagName === 'IMG' ? overlay : null;
    }

    setupInterval('mainImageOverlay', intervalName => {
        const overlayElement = getMainImageOverlay();
        if (overlayElement) {
            overlayElement.remove();
            clearIntervalByName(intervalName);
        }
    }, 100);

    function getCookieBannerOverlay() {
        const headers = Array.from(document.querySelectorAll('h2'));
        const cookieHeader = headers.find(h => h.innerText.includes('Cookies'));

        let overlay = cookieHeader;
        while (overlay && overlay.parentElement !== document.body) {
            overlay = overlay.parentElement;
        }
        return overlay;
    }

    setupInterval('removeCookieBanner', intervalName => {
        const overlayElement = getCookieBannerOverlay();
        if (overlayElement) {
            overlayElement.style.setProperty('display', 'none');
            clearIntervalByName(intervalName);
        }
    }, 100);
}

setInterval(() => {
    if (window.location.href !== lastUrl) {
        console.log('reload intervals');
        lastUrl = window.location.href;
        clearAllIntervals();
        setupIntervals();
    }
}, 100);