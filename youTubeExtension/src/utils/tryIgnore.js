export default function tryIgnore(func) {
    try {
        return func();
    } catch {
        return null;
    }
}