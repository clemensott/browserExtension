export default function importBundle(scriptName) {
    const websiteBundleUrl = chrome.runtime.getURL(scriptName);

    const script = document.createElement('script');
    script.src = websiteBundleUrl;
    script.async = false;
    (document.body || document.documentElement).prepend(script);
}