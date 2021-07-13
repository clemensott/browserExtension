(function () {
    function getReloadingEnabled() {
        return localStorage.getItem('subscriptionBoxReloadEnabled') == true;
    }

    function getReloadingSeconds() {
        return Number(localStorage.getItem('subscriptionBoxReloadSeconds')) || 300;
    }

    let checkBox, infoText, timeout = null;

    function initUI() {
        checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.id = 'auto-reload-page';
        checkBox.onchange = e => {
            localStorage.setItem('subscriptionBoxReloadEnabled', e.target.checked ? 1 : 0);
            setReload(e.target.checked);
        };

        const checkBoxLabel = document.createElement('label');
        checkBoxLabel.setAttribute('for', checkBox.id);
        checkBoxLabel.innerText = 'Auto Reloading';

        const checkBoxContainer = document.createElement('span');
        checkBoxContainer.style.display = 'flex';
        checkBoxContainer.style['align-items'] = 'center';
        checkBoxContainer.appendChild(checkBox);
        checkBoxContainer.appendChild(checkBoxLabel);

        infoText = document.createElement('span');
        infoText.style['margin-left'] = '3px';

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style['align-items'] = 'center';
        container.style['text-align'] = 'right';
        container.appendChild(checkBoxContainer);
        container.appendChild(infoText);
        document.querySelector('#title-container').insertBefore(container, document.querySelector('#spacer'));
    }

    function updateTimeoutUI() {
        infoText.innerText = !!timeout ? ` in ${((timeout.until - Date.now()) / 1000).toFixed(0)}s` : '';
    }

    function reloadPage() {
        if (window.location.pathname.startsWith('/feed/subscriptions')) {
            window.location.reload();
        }
    }

    function setReload(enable) {
        if (timeout) {
            clearTimeout(timeout.id);
            clearInterval(timeout.updateIntervalId);
            timeout = null;
        }

        if (enable) {
            const reloadTime = getReloadingSeconds() * 1000;
            timeout = {
                id: setTimeout(reloadPage, reloadTime),
                until: Date.now() + reloadTime,
                updateIntervalId: setInterval(updateTimeoutUI, 500),
            };
        }

        updateTimeoutUI();
    }

    initUI();
    console.log('reload subscription page enabled:', getReloadingEnabled());
    if (getReloadingEnabled()) {
        checkBox.checked = true;
        setReload(true);
    };
})()