// ts/utils.ts
export function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
}
// KALENDER.TS
// Helper to calculate the exact Monday and Sunday dates for any given ISO week and year: Now Timezone proof!
export function getDatesOfWeek(weekNo, year) {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const week1Monday = new Date(year, 0, 4 - dayOfWeek + 1);
    const targetMonday = new Date(week1Monday.getTime() + (weekNo - 1) * 7 * 24 * 60 * 60 * 1000);
    const targetSunday = new Date(targetMonday.getTime() + 6 * 24 * 60 * 60 * 1000);
    // Helper to format local date without UTC conversion shifting the day backward
    const formatLocal = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    return {
        start: formatLocal(targetMonday),
        end: formatLocal(targetSunday)
    };
}
