import triggerEvent from '../utils/triggerEvent';

const constants = {
    FETCH_TEXT_EVENT_NAME: 'FetchIntersectorService.onfetchtext',
    DISABLE_EVENT_NAME: 'FetchIntersectorService.ondisable',
};

class FetchIntersectorService {
    constructor() {
        this.isSendingEnabled = false;
        this.queue = [];

        this.onDisabled = this.onDisabled.bind(this);
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

    isResponseRelevant(url) {
        return [
            'https://www.youtube.com/youtubei/v1/next',
            'https://www.youtube.com/youtubei/v1/browse',
            'https://www.youtube.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/search',
            'https://www.youtube.com/youtubei/v1/reel/reel_item_watch',
        ].some(u => url.startsWith(u))
    }

    enable() {
        if (typeof Response.prototype.oldText === 'function' &&
            Response.prototype.text !== Response.prototype.oldText) {
            return;
        }
        const that = this;
        if (typeof Response.prototype.oldText !== 'function') {
            Response.prototype.oldText = Response.prototype.text;
        }
        Response.prototype.text = async function () {
            const text = await Response.prototype.oldText.call(this);
            if (that.isResponseRelevant(this.url)) {
                that.handleData({
                    url: this.url,
                    text,
                });
            }
            return text;
        };
        document.addEventListener(constants.DISABLE_EVENT_NAME, this.onDisabled);
    }

    disable() {
        if (typeof Response.prototype.oldText === 'function') {
            Response.prototype.text = Response.prototype.oldText;
        }
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

    addOnTextListener(callback) {
        document.addEventListener(constants.FETCH_TEXT_EVENT_NAME, callback);
    }

    removeOnTextListener(callback) {
        document.removeEventListener(constants.FETCH_TEXT_EVENT_NAME, callback);
    }
}

export default new FetchIntersectorService();