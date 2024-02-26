import browser from 'webextension-polyfill';

export default function importBundle(scriptName) {
    const websiteBundleUrl = browser.runtime.getURL(scriptName);

    const script = document.createElement('script');
    script.src = websiteBundleUrl;
    script.async = false;
    (document.body || document.documentElement).prepend(script);
}
