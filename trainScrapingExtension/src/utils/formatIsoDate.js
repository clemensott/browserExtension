export function formatIsoDate(date) {
    return date.toISOString().split('T')[0];
}
