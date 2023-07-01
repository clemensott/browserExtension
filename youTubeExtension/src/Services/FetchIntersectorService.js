import triggerEvent from '../utils/triggerEvent';

const eventName = 'fetchIntersect.onfetchtext';

class FetchIntersectorService {
    constructor() {
        this.isSendingEnabled = false;
        this.queue = [];
    }

    sendData(data) {
        try {
            triggerEvent(eventName, data);
        } catch (e) {
            console.error('fetch wrapper send data error', e);
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
        const that = this;
        Response.prototype.oldText = Response.prototype.text;
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
    }

    disable() {
        Response.prototype.text = Response.prototype.text;
    }

    enableSending() {
        this.isSendingEnabled = true;
        this.queue.forEach(data => this.sendData(data));
        this.queue.splice(0);
    }

    addOnTextListener(callback) {
        document.addEventListener(eventName, callback);
    }

    removeOnTextListener(callback) {
        document.removeEventListener(eventName, callback);
    }
}

export default new FetchIntersectorService();