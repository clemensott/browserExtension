export class InsiteCommunicator {
    constructor(type) {
        this.type = type;
    }

    static sendMessage(type, data) {
        const customEvent = new CustomEvent(`InsiteCommunicator.${type}`, {
            detail: data,
        });
        document.dispatchEvent(customEvent);
    }

    static addMessageListener(type, callback) {
        document.addEventListener(`InsiteCommunicator.${type}`, callback);
    }

    static removeMessageListener(type, callback) {
        document.removeEventListener(`InsiteCommunicator.${type}`, callback);
    }

    sendMessage(data){
        InsiteCommunicator.sendMessage(this.type, data);
    }

    addMessageListener(callback){
        InsiteCommunicator.addMessageListener(this.type, callback);
    }

    removeMessageListener(callback){
        InsiteCommunicator.removeMessageListener(this.type, callback);
    }
}
