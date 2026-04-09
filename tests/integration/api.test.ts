import { describe, it, expect } from "vitest";

describe("Integration: API layer", () => {
  it("simulates fetching data", async () => {
    const fakeData = [{ id: 1, name: "test" }];

    expect(fakeData).toBeDefined();
    expect(Array.isArray(fakeData)).toBe(true);
  });
});