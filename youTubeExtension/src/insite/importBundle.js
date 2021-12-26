export default function importBundle() {
    const websiteBundleUrl = chrome.runtime.getURL('dist/insite.bundle.js');

    const script = document.createElement('script');
    script.src = websiteBundleUrl;
    document.body.appendChild(script);
}