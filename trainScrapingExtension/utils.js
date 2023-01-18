function utils() {
    String.prototype.leftPad = function (amount, char) {
        const pad = String.fromCharCode(...Array(amount).fill(char.charCodeAt(0)));
        return (pad + this).slice(-amount);
    };

    Date.prototype.addMilliseconds = function (millis) {
        const date = new Date(this.valueOf());
        date.setMilliseconds(date.getMilliseconds() + millis);
        return date;
    };

    function toStringWithLeftPad(no, amount = 2, char = '0') {
        return no.toString().leftPad(amount, char);
    }
    Date.prototype.toUtcIsoString = function () {
        const year = this.getUTCFullYear().toString();
        const month = toStringWithLeftPad(this.getUTCMonth() + 1);
        const day = toStringWithLeftPad(this.getUTCDate());
        const hour = toStringWithLeftPad(this.getUTCHours());
        const minute = toStringWithLeftPad(this.getUTCMinutes());
        const second = toStringWithLeftPad(this.getUTCSeconds());
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    };

    const parseUtcRegex = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/;
    window.utcToUnix = text => {
        const result = text && text.match(parseUtcRegex);
        if (!result) {
            return null;
        }
        const [_, year, month, day, hour, minute, second] = result;
        return Date.UTC(year, month - 1, day, hour, minute, second);
    };

    window.parseCoordinate = raw => {
        return parseInt(raw, 10) / 1000000.0;
    };
}
