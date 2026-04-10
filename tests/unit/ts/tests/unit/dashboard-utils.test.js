import { describe, test, expect } from "vitest";
import { toggleArrayValue } from "../../ts/dashboard-utils";

describe("toggleArrayValue", () => {
  test("lägger till id om det inte finns", () => {
    expect(toggleArrayValue(["1", "2"], "3")).toEqual(["1", "2", "3"]);
  });

  test("tar bort id om det redan finns", () => {
    expect(toggleArrayValue(["1", "2", "3"], "2")).toEqual(["1", "3"]);
  });
});