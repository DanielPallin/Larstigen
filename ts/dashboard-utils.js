export function toggleArrayValue(arr, id) {
    return arr.includes(id)
        ? arr.filter((item) => item !== id)
        : [...arr, id];
}
