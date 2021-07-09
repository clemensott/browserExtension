function getHide(...selector) {
    return {
        selector,
        style: {
            display: 'none',
        },
    };
}

function getRemove(selector) {
    return {
        selector,
        remove: true,
    };
}

function getRemoveClasses(selector, ...removeClasses) {
    return {
        selector,
        removeClasses,
    };
}

function getSimpleHide(selector) {
    return [getHide(selector)];
}

function clearOverflow(selector) {
    return {
        selector,
        delay: 500,
        style: {
            overflow: 'initial'
        },
    };
}

const actionConfigs = [
    getSimpleHide('.cmp_app.cmp_overwriteLevel1#consentDialog'),
    getSimpleHide('#gdpr-consent-tool-wrapper'),
    getSimpleHide('#chrome > div.cc_banner-wrapper > div.cc_banner.cc_container.cc_container--open'),
    getSimpleHide('#qc-cmp2-container.qc-cmp2-container'),
    getSimpleHide('.snigel-cmp-framework#snigel-cmp-framework'),
    getSimpleHide('#onetrust-consent-sdk'),
    [
        getHide('#CybotCookiebotDialog[name=CybotCookiebotDialog]'),
        getRemove('#CybotCookiebotDialogBodyUnderlay'),
    ],
    [
        getHide('body > .tp-modal'),
        getRemove('body > .tp-backdrop.tp-active'),
        getRemoveClasses('html', 'tp-modal-open'),
        getRemoveClasses('body', 'tp-modal-open'),
    ],
    [
        getHide('div[class*=ConsentManager__Overlay]'),
        clearOverflow('html'),
        clearOverflow('body'),
    ],
    [
        getHide('#cookiebanner.modal'),
        getRemoveClasses('body', 'cookiebanner-modal-open'),
    ],
    [
        getRemove('div[id*=sp_message_container_]'),
        getRemoveClasses('html', 'sp-message-open'),
    ],
];

const bannerIntervalId = setInterval(() => {
    checkSimpleContainers(actionConfigs);
}, 100);

function clearBannerInterval() {
    clearInterval(bannerIntervalId);
}

function hide(element) {
    element.style.display = 'none';
}

setTimeout(clearBannerInterval, 10000);

function getElement(selectors) {
    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }
    return selectors.reduce((element, selector) => element || document.querySelector(selector), null);
}

async function handleElement({ element, config }) {
    if (config.delay) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    if (config.style) {
        Object.keys(config.style).forEach(key => element.style[key] = config.style[key]);
    }
    if (config.removeClasses) {
        config.removeClasses.forEach(className => element.classList.remove(className));
    }
    if (config.remove) {
        element.remove();
    }
}

function checkSimpleContainers(actions) {
    for (let i = 0; i < actions.length; i++) {
        const elements = actions[i].map(config => ({
            element: getElement(config.selector),
            config,
        }));
        if (elements.every(element => element.element)) {
            elements.forEach(handleElement);
            clearBannerInterval();
            break;
        }
    }
}