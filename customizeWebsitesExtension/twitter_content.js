console.log('twitter content script');

const buttonTexts = {
    login: [
        'ANMELDEN',
        'LOGIN',
        'SIGN IN',
    ],
    signUp: [
        'REGISTRIEREN',
        'SIGN UP',
    ],
};

function equalsLink(href, path) {
    return href === (window.location.origin + path);
}

function hasLoginButtons(element) {
    const links = Array.from(element.querySelectorAll('a'));
    if (links.some(a => equalsLink(a.href, '/login')) &&
        links.some(a => equalsLink(a.href, '/i/flow/signup'))) {
        return true;
    }

    const texts = Array.from(element.querySelectorAll('div[role="button"]'))
        .map(div => div.innerText.toUpperCase());
    return texts.some(t => buttonTexts.login.includes(t)) &&
        texts.some(t => buttonTexts.signUp.includes(t));
}

function createCssSelector(element) {
    const classes = Array.from(element.classList).map(c => `.${c}`).join('');
    return element.tagName + classes;
}

function createHideElementStyle(element) {
    return `
        ${createCssSelector(element)} {
            display: none!important;
        }`;
}

const dynamicStyles = {
    loginBanner: {
        storageKey: 'custom_extension_twitter_login_banner_style_cache',
        selector: '#layers > div:nth-child(2) > div > div > div > div > div > div:nth-child(2)',
        isMatchingElement: hasLoginButtons,
        createStyle: cookieBanner => `
            ${createHideElementStyle(cookieBanner)}
    
            html {
                overflow: initial!important; 
            }
        `,
        styleElement: null,
        intervalId: null,
    },
    loginFooter: {
        storageKey: 'custom_extension_twitter_login_footer_style_cache',
        selector: '#layers > div:nth-child(1)',
        isMatchingElement: hasLoginButtons,
        createStyle: createHideElementStyle,
        styleElement: null,
        intervalId: null,
    },
};

function updateDynamicStyle(dynamicStyle) {
    document.querySelectorAll(dynamicStyle.selector).forEach(e => {
        if (dynamicStyle.isMatchingElement(e)) {
            const styleHTML = dynamicStyle.createStyle(e);
            dynamicStyle.styleElement.innerHTML = styleHTML;

            localStorage.setItem(dynamicStyle.storageKey, styleHTML);
            clearInterval(dynamicStyle.intervalId);
        }
    });
}

Object.values(dynamicStyles).forEach(d => {
    d.styleElement = document.createElement('style');
    d.styleElement.innerHTML = localStorage.getItem(d.storageKey) || '';
    document.body.appendChild(d.styleElement);

    d.intervalId = setInterval(updateDynamicStyle, 500, d);
});