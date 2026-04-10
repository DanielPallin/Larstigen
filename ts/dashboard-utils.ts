export function toggleArrayValue(arr: string[], id: string): string[] {
  return arr.includes(id)
    ? arr.filter((item) => item !== id)
    : [...arr, id];
}