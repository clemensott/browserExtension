const intervalId = setInterval(() => {
    const element = document.querySelector('#snigel-cmp-framework');
    if (element) {
        element.remove();
        clearInterval(intervalId)
    }
}, 100);

setTimeout(() => clearInterval(intervalId), 5000);