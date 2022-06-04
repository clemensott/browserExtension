(function () {
    if (!localStorage.getItem('extension-fix-notification-bug')) {
        return;
    }

    console.log('fix reddit notification');
    const fixNotificationBugIntervalIds = {
        title: null,
        chatNotifaction: null,
    };
    let lastHref = null;

    function fixTitle() {
        if (document.title.startsWith('(1) ')) {
            document.title = document.title.replace('(1) ', '');
            return true;
        }
        return false;
    }

    function fixChatNotification() {
        let changed = false;
        const lastChatNotificiationCountKey = 'last-notification-count';
        const chatNotificationCount = document.querySelector('a[href="https://www.reddit.com/chat"] > span');
        if (chatNotificationCount) {
            let count = parseInt(chatNotificationCount.innerText, 10);
            const lastCount = parseInt(chatNotificationCount.getAttribute(lastChatNotificiationCountKey), 10);
            if (count !== lastCount && count > 0) {
                count--;
                chatNotificationCount.innerText = count;
                chatNotificationCount.setAttribute(lastChatNotificiationCountKey, count);
                changed = true;
            }
            if (count > 0) {
                chatNotificationCount.style.removeProperty('display');
            } else {
                chatNotificationCount.style.setProperty('display', 'none');
            }
        }

        return changed;
    }

    function setFixInterval(name, timeout, fixFunc, ...args) {
        clearInterval(fixNotificationBugIntervalIds[name]);
        fixNotificationBugIntervalIds[name] = setInterval(fixFunc, timeout, ...args);
    }

    function fixFast(name, fixFunc) {
        if (fixFunc()) {
            clearInterval(fixNotificationBugIntervalIds[name]);
            fixNotificationBugIntervalIds[name] = setInterval(fixFunc, 2000);
        }
    }

    setInterval(() => {
        if (lastHref !== window.location.href) {
            setFixInterval('title', 200, fixFast, 'title', fixTitle);
            setFixInterval('chatNotifaction', 200, fixFast, 'chatNotifaction', fixChatNotification);
            lastHref = window.location.href;
        }
    }, 100);
})();
