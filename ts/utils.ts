// ts/utils.ts

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}