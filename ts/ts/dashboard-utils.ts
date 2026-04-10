export function toggleArrayValue(arr: string[], id: string): string[] {
  return arr.includes(id)
    ? arr.filter((item) => item !== id)
    : [...arr, id];
}

// export function formatDate(dateString: string): string {
//   const date = new Date(dateString);
//   return date.toLocaleDateString("sv-SE");
// }

