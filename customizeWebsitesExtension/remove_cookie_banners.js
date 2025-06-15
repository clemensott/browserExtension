const debugKey = 'debug';

function getHide(...selector) {
    return {
        selector,
        attributes: {
            is_cookie_banner_hide: 1,
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

function getAddClasses(selector, ...removeClasses) {
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
        attributes: {
            is_cookie_banner_initial_overflow: '',
        },
    };
}

const actionConfigs = [
    [
        getHide('div.i-amphtml-consent-ui-mask'),
        getHide('body > amp-consent'),
        getRemoveClasses('html', 'i-amphtml-scroll-disabled'),
    ],
    [
        getHide('#CybotCookiebotDialog[name=CybotCookiebotDialog]'),
        getRemove('#CybotCookiebotDialogBodyUnderlay'),
        clearOverflow('body'),
        clearOverflow('html'),
    ],
    [
        getHide('#CybotCookiebotDialog[name=CybotCookiebotDialog]'),
        clearOverflow('body'),
        clearOverflow('html'),
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
        getHide('#easycmp'),
        getRemoveClasses('body', 'sws-cmp-visible'),
    ],
    [
        getRemove('div[id*=sp_message_container_]'),
        getRemoveClasses('html', 'sp-message-open'),
    ],
    [
        getRemove('.fc-consent-root'),
        clearOverflow('html'),
        clearOverflow('body'),
    ],
    [
        getHide('div.popup.popup__cookie'),
        getRemoveClasses('body', 'hasPopup'),
    ],
    [
        getHide('#tzi-paywahl-bg'),
        getHide('#tzi-paywahl-fg'),
    ],
    [
        getHide('#cookieconsent.first'),
        getHide('#cookie-bg'),
    ],
    [
        getHide('#gdpr-cookie-canvas'),
        getHide('#gdpr-cookie-message'),
    ],
    [
        getHide(() => document.querySelector("#usercentrics-root").shadowRoot.querySelector("#focus-lock-id")),
        clearOverflow('body'),
    ],
    [
        getHide('#page-1788782821 > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.cc-individual-cookie-settings.ui-draggable'),
        getHide('#page-1788782821 > div.ui-widget-overlay.ui-front.cc-individual-cookie-settings-overlay'),
    ],
    [
        getRemove('#cmp-style-reset'),
        clearOverflow('.cmp-prevent-scroll'),
    ],
    [
        getHide('#cmpbox2'),
        getRemove('#cmpbox'),
        clearOverflow('body'),
    ],
    [
        getHide('#cmpbox'),
    ],
    [
        getRemove('#didomi-host'),
        getRemoveClasses('body', 'didomi-popup-open'),
    ],
    [
        getHide('div.overlay_el5_B'),
        getAddClasses('html', 'allow-scroll'),
    ],
    [
        getHide('div.i-amphtml-consent-ui-mask'),
        getHide('amp-consent#inews-consent'),
        getRemoveClasses('html', 'i-amphtml-scroll-disabled'),
    ],
    [
        getHide('#usercentrics-root'),
        clearOverflow('body'),
    ],
    [
        getHide('div[data-tracking-opt-in-overlay]'),
        clearOverflow('body'),
    ],
    [
        getHide('#onetrust-consent-sdk'),
        getHide('div[data-nosnippet="data-nosnippet"]'),
        getRemoveClasses('body', 'onetrust-no-scroll'),
        clearOverflow('body'),
    ],
    [
        getHide('#cc-overlay'),
        clearOverflow('body'),
    ],
    [
        getHide('div.b-modal-banner__banner.js-privacy-consent-banner__banner.b-modal-banner__banner--center'),
        getHide('div.b-modal-banner__overlay.js-privacy-consent-banner__overlay'),
        getRemoveClasses('html', 'b-modal-banner--disabled'),
        getRemoveClasses('body', 'b-modal-banner--disabled'),
    ],
    [
        getHide('privacy-layer'),
        clearOverflow('html'),
    ],
    [
        getHide('.cmp-root-container'),
        getRemoveClasses('html', 'cmp-modal-open'),
    ],
    [
        getHide('div.close[data-testid="modalBackground"][data-scroll-lock-scrollable="true"]'),
        clearOverflow('body'),
    ],
    [
        getHide('.privacy-consent--backdrop'),
        getHide('.privacy-consent--modal'),
        getRemoveClasses('body', 'privacy-consent--active'),
    ],
    [
        getHide('div.modal-backdrop'),
        getHide('div.modal-backdrop + div.modal'),
        getRemoveClasses('body', 'modal-open', 'modal-fade', 'consent-modal'),
    ],
    [
        getHide('div#modal:has([data-purpose="cookieBar.button.accept"])'),
        getRemoveClasses('body', 'noScrolling'),
    ],
    [
        getHide('div#cookie-law-info-bar'),
        getHide('div.cli-modal-backdrop.cli-fade.cli-popupbar-overlay.cli-show'),
        getRemoveClasses('body', 'cli-barmodal-open'),
    ],
    [
        getHide('svi-policy-layover'),
        clearOverflow('body'),
    ],
    [
        getRemove('div#cmpwrapper.cmpwrapper'),
        clearOverflow('body'),
    ],
    [
        getRemove('#consentBanner'),
        clearOverflow('body'),
    ],
    [
        getHide('#modal_cct'),
        getHide('.modal-backdrop'),
        getRemoveClasses('body', 'modal-open'),
    ],
    [
        getHide('#PrivacyCategoryAlert'),
        getHide('.modal-backdrop'),
        getRemoveClasses('body', 'modal-open'),
    ],
    [
        getHide('#dr_cookie_banner_container'),
        getHide('#dr_blocking_div'),
    ],
    [
        getHide('.ccm-root'),
        getRemoveClasses('body', 'ccm-blocked'),
        getRemoveClasses('html', 'ccm-blocked'),
    ],
    [
        getRemove('#iubenda-cs-banner'),
        clearOverflow('html'),
    ],
];

const bannerIntervalId = setInterval(() => {
    checkSimpleContainers(actionConfigs);
}, 100);

let foundCookieBanner = false;

function clearBannerInterval() {
    clearInterval(bannerIntervalId);
}

function hide(element) {
    element.style.display = 'none';
}

setTimeout(clearBannerInterval, 10000);

function getElementFromSelector(selector) {
    try {
        return typeof selector === 'function' ? selector() : document.querySelector(selector);
    } catch {
        return null;
    }
}

function getElementFromSelectors(selectors) {
    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }
    return selectors.reduce((element, selector) => element || getElementFromSelector(selector), null);
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
    if (config.addClasses) {
        config.removeClasses.forEach(className => element.classList.add(className));
    }
    if (config.attributes) {
        Object.entries(config.attributes).forEach(([key, value]) => element.setAttribute(key, value));
    }
    if (config.remove) {
        element.remove();
    }
}

function checkSimpleContainers(configs) {
    const found = configs.find(actions => {
        const debug = actions.includes(debugKey);
        const list = debug ? actions.filter(item => typeof item === 'object') : actions;
        const elements = list.map(config => ({
            element: getElementFromSelectors(config.selector),
            config,
        }));
        if (debug) {
            console.log('elements:', elements);
        }
        if (elements.every(element => element.element)) {
            elements.forEach(handleElement);
            return true;
        }
        return false;
    });
    if (!foundCookieBanner && found) {
        foundCookieBanner = true;
        setTimeout(clearBannerInterval, 1000);
        console.log('found cookie banner', found);
    }
}