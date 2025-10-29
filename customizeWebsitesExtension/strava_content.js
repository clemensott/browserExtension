function getFeedEntries() {
    return document.querySelectorAll('div[id^="feed-entry-"]:not([data-extension-handled])');
}

function shouldHideFeedEntry(entry) {
    if (entry.querySelector('[data-testid="promo-img"]')) {
        return true;
    }

    if (entry.querySelector('a[href*="/challenges/"][data-testid="title-text"]')) {
        return true;
    }

    return false;
}

function handleFeedEntry(entry) {
    if (entry.dataset.extensionHandled) {
        return;
    }

    entry.dataset.extensionHandled = '1';

    if (shouldHideFeedEntry(entry)) {
        entry.style.display = 'none';
    }
}

setInterval(() => {
    const feedEntries = getFeedEntries();
    feedEntries.forEach(handleFeedEntry);
}, 500);
