export default function importBundle() {
    const websiteBundleUrl = chrome.runtime.getURL('insite.bundle.js');

    const script = document.createElement('script');
    script.src = websiteBundleUrl;
    document.body.appendChild(script);
}