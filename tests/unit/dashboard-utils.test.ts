import { describe, expect, test } from "vitest";
import { toggleArrayValue } from "../../ts/dashboard-utils.ts";

describe("toggleArrayValue", () => {
  test("lägger till värde", () => {
    expect(toggleArrayValue(["a"], "b")).toEqual(["a", "b"]);
  });

  test("tar bort värde", () => {
    expect(toggleArrayValue(["a", "b"], "b")).toEqual(["a"]);
  });
});