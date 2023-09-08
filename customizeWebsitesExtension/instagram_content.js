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
        for (let i = document.body.childElementCount - 1; i >= 0; i--) {
            const child = document.body.children.item(i);
            if (child.querySelector('input[name="username"]')) {
                return child;
            }
        }
        return null;
    }

    if (!window.location.href.startsWith('https://www.instagram.com/accounts/login')) {
        let removedLoginOverlay = false;
        setupInterval('loginInterval', intervalName => {
            const overlayBaseElement = getLoginOverlay();
            if (overlayBaseElement) {
                overlayBaseElement.style.setProperty('display', 'none');
                // removedLoginOverlay = true;
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
        for (let i = document.body.childElementCount - 1; i >= 0; i--) {
            const child = document.body.children.item(i);
            if (child.tagName !== 'DIV') {
                continue;
            }
            const cookieCount = child.innerText.toLowerCase().split('cookie').length;
            if (cookieCount > 10) {
                return child;
            }
        }
        return null;
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