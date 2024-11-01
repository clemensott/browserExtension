import triggerEvent from '../utils/triggerEvent';

const constants = {
    FETCH_TEXT_EVENT_NAME: 'FetchIntersectorService.onfetchtext',
    DISABLE_EVENT_NAME: 'FetchIntersectorService.ondisable',
    REDUCE_VIDEOS_EVENT_NAME: 'FetchIntersectorService.onreducevideos',
};

function reduceVideos(text) {
    const obj = JSON.parse(text);
    return JSON.stringify(obj, (key, value) => {
        if (['contents', 'continuationItems'].includes(key)
            && Array.isArray(value)
            && 'continuationItemRenderer' in value[value.length - 1]) {
            let foundOne = false;
            return value.filter(entry => {
                if ('richItemRenderer' in entry) {
                    if (foundOne) {
                        return false;
                    }

                    foundOne = true;
                    return true;
                }
                return true;
            });
        }
        return value;
    })
}

class FetchIntersectorService {
    constructor() {
        this.isSendingEnabled = false;
        this.reduceVideosEnabled = false;
        this.queue = [];
        this.wins = new Set();

        this.onDisabled = this.onDisabled.bind(this);
        document.addEventListener(constants.REDUCE_VIDEOS_EVENT_NAME, ({ detail }) => this.reduceVideosEnabled = detail);
    }

    sendData(data) {
        try {
            triggerEvent(constants.FETCH_TEXT_EVENT_NAME, data);
        } catch (e) {
            console.error('fetch intersector send data error', e);
        }
    }

    handleData(data) {
        if (this.isSendingEnabled) {
            this.sendData(data);
        } else {
            this.queue.push(data);
        }
    }

    static isResponseRelevant(url) {
        return [
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/search',
            'https://www.youtube.com/youtubei/v1/reel/reel_item_watch',
        ].some(u => url.startsWith(u))
    }

    wrapResponse(win) {
        if (!win || this.wins.has(win)) {
            return;
        }

        if (typeof win.Response.prototype.oldText === 'function' &&
            win.Response.prototype.text !== win.Response.prototype.oldText) {
            return;
        }
        const that = this;
        if (typeof win.Response.prototype.oldText !== 'function') {
            win.Response.prototype.oldText = win.Response.prototype.text;
        }
        win.Response.prototype.text = async function () {
            const text = await win.Response.prototype.oldText.call(this);
            if (FetchIntersectorService.isResponseRelevant(this.url)) {
                that.handleData({
                    url: this.url,
                    text,
                });
            }
            return that.reduceVideosEnabled ? reduceVideos(text) : text;
        };

        this.wins.add(win);
    }

    enable() {
        function checkBody(body) {
            const bodyWins = [...body.querySelectorAll('iframe')].map(iframe => iframe.contentWindow);
            bodyWins.forEach(win => this.wrapResponse(win));
        }

        const bodyMutationObserver = new MutationObserver(records => records.forEach(record => {
            record.addedNodes.forEach(addedNode => {
                if (addedNode.tagName?.toLowerCase() === 'iframe') {
                    this.wrapResponse(addedNode.contentWindow);
                }
            })
        }));

        const documentMutationObserver = new MutationObserver(records => records.forEach(record => {
            record.addedNodes.forEach(addedNode => {
                if (addedNode.tagName?.toLowerCase() === 'body') {
                    bodyMutationObserver.observe(addedNode, {
                        subtree: false,
                        childList: true,
                        attributes: false,
                    });
                    documentMutationObserver.disconnect();
                    checkBody(addedNode);
                }
            })
        }));

        documentMutationObserver.observe(document, {
            subtree: true,
            childList: true,
            attributes: false,
        });

        if (document.body) {
            checkBody(document.body);
        }

        this.wrapResponse(window);

        document.addEventListener(constants.DISABLE_EVENT_NAME, this.onDisabled);
    }

    unwrapResponse(win) {
        if (typeof win.Response.prototype.oldText === 'function') {
            win.Response.prototype.text = win.Response.prototype.oldText;
        }

        this.wins.delete(win);
    }

    disable() {
        this.wins.forEach(win => this.unwrapResponse(win));
        document.removeEventListener(constants.DISABLE_EVENT_NAME, this.onDisabled);
        triggerEvent(constants.DISABLE_EVENT_NAME, null);
    }

    onDisabled() {
        this.disable();
    }

    enableSending() {
        this.isSendingEnabled = true;
        this.queue.forEach(data => this.sendData(data));
        this.queue.splice(0);
    }

    setReduceVideosEnabled(value) {
        this.reduceVideosEnabled = !!value;
        triggerEvent(constants.REDUCE_VIDEOS_EVENT_NAME, !!value);
    }

    addOnTextListener(callback) {
        document.addEventListener(constants.FETCH_TEXT_EVENT_NAME, callback);
    }

    removeOnTextListener(callback) {
        document.removeEventListener(constants.FETCH_TEXT_EVENT_NAME, callback);
    }
}

export default new FetchIntersectorService();