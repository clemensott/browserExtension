importIntoWebsite(function ({ setFakeMicButton }) {
    function addToggleDisplayVideoState(element, className) {
        const disableStyle = `.${className} { display:none }`;
        const disableStyleElement = document.createElement('style');
        document.body.appendChild(disableStyleElement);

        setFakeMicButton(element, 'Toggle user video state UI');
        element.onclick = () => {
            disableStyleElement.innerHTML = disableStyleElement.innerHTML ? '' : disableStyle;
        };
    }

    return {
        addToggleDisplayVideoState,
    };
});