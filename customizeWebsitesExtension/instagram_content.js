const intervalIds = new Map();
const lastState = {
    url: null,
    element: null,
    text: null,
};

function clearIntervalByName(name) {
    console.log('clear interval by name:', name, intervalIds.get(name));
    if (intervalIds.has(name)) {
        clearInterval(intervalIds.get(name));
        delete intervalIds.delete(name);
    }
}

function setupInterval(intervalName, callback, timeout) {
    clearIntervalByName(intervalName);
    intervalIds.set(intervalName, setInterval(callback, timeout, intervalName));
}

function setHidden(element) {
    element.dataset.extensionHidden = '';
}

function setupIntervals() {
    function isLoginBottemBannerCloseButton(element) {
        return !!element.parentElement.querySelector('a[role=link][href*="/accounts/login"]');
    }

    function getLoginBottomBannerCloseButton() {
        return [...document.querySelectorAll('button > span[aria-label="Close"]')]
            .map(element => element.parentElement)
            .find(isLoginBottemBannerCloseButton);
    }

    setupInterval('loginBottomBanner', intervalName => {
        const loginBottomBanner = getLoginBottomBannerCloseButton();
        if (loginBottomBanner) {
            loginBottomBanner.click();
            clearIntervalByName(intervalName);
        }
    }, 100);

    // The div element that lies over the main image to avoid downloading
    function getMainImageOverlays() {
        return [...document.querySelectorAll('img[alt^="Photo shared by"]')]
            .map(img => img.parentElement.nextSibling);
    }

    setupInterval('mainImageOverlay', intervalName => {
        const overlayElements = getMainImageOverlays();
        if (overlayElements.length) {
            overlayElements.forEach(setHidden);
            clearIntervalByName(intervalName);
        }
    }, 100);
}

function isLoginOverlay(element) {
    return element.querySelector('input[name="username"]');
}

function isCookieBanner(element) {
    const cookieCount = element.innerText.toLowerCase().split('cookie', 10).length;
    return cookieCount >= 10;
}

function setupBodyElementObserver() {
    const observer = new MutationObserver(changes => changes
        .flatMap(({ addedNodes }) => [...(addedNodes || [])])
        .filter(element => isLoginOverlay(element) || isCookieBanner(element))
        .forEach(setHidden));

    observer.observe(document.body, {
        childList: true,
    });

    Array.from(document.body.children)
        .filter(element => isLoginOverlay(element) || isCookieBanner(element))
        .forEach(setHidden);
}

function sanitizeString(str) {
    return typeof str === 'string' ? str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        : str;
}

function runFunctionInsite(func) {
    const code = `(${func.toString()})();`;
    const isFirefox = typeof InstallTrigger !== 'undefined';
    if (isFirefox) {
        window.eval(code);
    } else {
        const div = document.createElement('div');
        div.innerHTML = `<svg onload="eval(this.dataset.code)" data-code="${sanitizeString(code)}" />`;
        div.style.display = 'none';
        document.body.appendChild(div);
    }
}

function setupVideoPlaybackInterval() {
    runFunctionInsite(function () {
        setInterval(() => {
            const video = document.querySelector('video');
            if (video && !video.oldPause) {
                let lastOverlayClicked = 0;

                video.oldPause = video.pause;
                video.pause = () => {
                    if (Date.now() - lastOverlayClicked < 50) video.oldPause();
                };

                const overlay = video.nextSibling.querySelector('div[role="presentation"]');
                const thumbnail = video.nextSibling.querySelector('img');
                overlay.addEventListener('click', () => {
                    if (thumbnail) {
                        thumbnail.style.display = 'none';
                    }
                    if (video.paused) video.play();
                    else {
                        video.oldPause();
                        lastOverlayClicked = Date.now();
                    }
                });
            }
        }, 1500);
    });
}


function changedPage() {
    if (window.location.href === lastState.url) {
        return false;
    }

    const element = document.contains(lastState.element)
        ? lastState.element : document.querySelector('h1');
    if (element.innerText === lastState.text) {
        return false;
    }

    lastState.url = window.location.href;
    lastState.element = element;
    lastState.innerText = element.innerText;

    return true;
}

setInterval(() => {
    if (changedPage()) {
        console.log('reload intervals');
        setTimeout(setupIntervals, 100);
    }
}, 100);

setupBodyElementObserver();
setupVideoPlaybackInterval();
