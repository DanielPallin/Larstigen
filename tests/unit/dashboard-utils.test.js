import { describe, test, expect } from "vitest";
import { toggleArrayValue } from "../../ts/dashboard";

describe("toggleArrayValue", () => {
  test("lägger till ett id som inte redan finns i arrayen", () => {
    const result = toggleArrayValue(["1", "2"], "3");
    expect(result).toEqual(["1", "2", "3"]);
  });
});