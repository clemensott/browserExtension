function muteVideo({ target }) {
    target.volume = 0;
}

setInterval(() => {
    const adPlayers = document.querySelectorAll(
        'div > div > div[id^=t3_z] div[data-isvideoplayer] > video:not([rdt-extension-muted])'
    );
    adPlayers.forEach(video => {
        video.addEventListener('volumechange', muteVideo);
        video.volume = 0;
        video.setAttribute('rdt-extension-muted', 1);
    });
}, 500);