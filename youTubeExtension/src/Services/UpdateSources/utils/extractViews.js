export function extractViews(text) {
    if (typeof text !== 'string') {
        return null;
    }

    text = text?.toUpperCase();
    if (text.includes('AUFRUFE')) {
        const strippedText = text.replace('AUFRUFE', '').trim();
        if (!strippedText.match(/^[0-9]+(\.[0-9]+)*$/)) {
            return null;
        }

        return Number.parseInt(strippedText.replaceAll('.', ''));
    }

    if (text.includes('VIEWS')) {
        const strippedText = text.replace('VIEWS', '').trim();
        if (!strippedText.match(/^[0-9]+(,[0-9]+)*$/)) {
            return null;
        }

        return Number.parseInt(strippedText.replaceAll(',', ''));
    }

    return null;
}
