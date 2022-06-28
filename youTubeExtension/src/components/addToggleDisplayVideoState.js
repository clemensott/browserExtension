import './addToggleDisplayVideoState.css';


function setFakeMicButton(element, label) {
    element.classList.add('yt-fake-mic-button-container');
    element.title = label;
}

export default function addToggleDisplayVideoState(element, classNames) {
    if (!Array.isArray(classNames)) {
        classNames = [classNames];
    }
    const selectors = classNames.map(className => `.${className}`);
    const disableStyle = `${selectors.join(',')} { display:none }`;
    const disableStyleElement = document.createElement('style');
    document.body.appendChild(disableStyleElement);

    setFakeMicButton(element, 'Toggle user video state UI');
    element.onclick = () => {
        disableStyleElement.innerHTML = disableStyleElement.innerHTML ? '' : disableStyle;
    };
}
