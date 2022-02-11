const elementId = 'yt-extension-exclusivity-check';

export default function checkExclusivity() {
    const div = document.createElement('div');
    div.id = elementId;

    if (document.getElementById(elementId)) {
        console.warn('Extension is not executed exclusivly');
        return false;
    }
    document.body.appendChild(div);
    return true;
}
