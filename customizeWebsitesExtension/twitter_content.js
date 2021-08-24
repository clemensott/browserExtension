function loop() {
    document.querySelectorAll('div[role=dialog]').forEach(e => {
        if (e.innerText.includes('Lass dir nichts Neues entgehen')) {
            e.remove();
            document.querySelector('html').style.overflow = 'initial';
        }
    });
}

console.log('twitter content script')
setInterval(loop, 1000);