setInterval(() => {
    const ads = Array.from(document.querySelectorAll('div > div > div[id*=t3_z]'))
        .filter(e => e.id.startsWith('t3_z='));

    ads.forEach(e => {
        e.parentElement.parentElement.style.setProperty('display', 'none');
        e.querySelectorAll('video').forEach(v => v.remove());
        e.removeAttribute('id');
    });
}, 500);