async function isOnline() {
    try {
        const { ok } = await fetch(window.location.href);
        return ok;
    } catch {
        return false;
    }
}

export default async function tryReloadSubscriptions() {
    while (true) {
        if (window.location.pathname.startsWith('/feed/subscriptions') && navigator.onLine && await isOnline()) {
            window.location.reload();
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}
