export function randomString(length) {
    const stepSize = Math.min(length - 1, 30);
    let text = 'r';
    while (length > text.length) {
        text += Math.random().toFixed(stepSize).replace('0.', '');
    }
    if (length < text.length) {
        text = text.substring(0, length);
    }
    return text;
}
