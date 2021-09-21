importIntoWebsite(function () {
    function setFakeMicButton(element, label) {
        element.classList.add('yt-fake-mic-button-container');
        element.title = label;
    }

    return {
        setFakeMicButton,
    };
})