function utils() {
    Date.prototype.addMilliseconds = function (millis) {
        const date = new Date(this.valueOf());
        date.setMilliseconds(date.getMilliseconds() + millis);
        return date;
    }
}
