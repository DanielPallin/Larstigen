import { test, expect } from "vitest";
import { getWeekNumber } from "../../ts/information";

test('getWeekNumber returnerar rätt vecka för april 2026', () => {
    const testDate = new Date('2026-04-09');
    expect(getWeekNumber(testDate)).toBe(15);
});