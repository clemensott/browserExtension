export function parseDuration(rawDuration) {
    if (typeof rawDuration !== 'string') {
        return null;
    }
    const parts = rawDuration.split(':');
    while (parts.length < 3) {
        parts.unshift('0');
    }
    const [hours, minutes, seconds] = parts;
    if (!hours || !minutes || !seconds) {
        return null;
    }
    return ((parseInt(hours, 10) * 60 + parseInt(minutes, 10)) * 60 + parseInt(seconds));
}

export function parseFormattedInt(raw) {
    const text = raw?.trim().split(' ')[0].replaceAll('.', '').replaceAll(',', '');
    return text ? parseInt(text, 10) : undefined;
}