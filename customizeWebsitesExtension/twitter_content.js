function equalsLink(href, path) {
    return href === (window.location.origin + path);
}

function loop() {
    document.querySelectorAll('div[role=dialog]').forEach(e => {
        const hasLoginButton = Array.from(e.querySelectorAll('a')).some(a => equalsLink(a.href, '/login'));
        const hasSignUpButton = Array.from(e.querySelectorAll('a')).some(a => equalsLink(a.href, '/i/flow/signup'));

        if (hasLoginButton && hasSignUpButton) {
            console.log('twitter remove login banner')
            e.remove();
            document.querySelector('html').style.overflow = 'initial';
        }
    });
}

console.log('twitter content script')
setInterval(loop, 1000);