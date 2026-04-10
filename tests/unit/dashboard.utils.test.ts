import { describe, expect, it } from "vitest";
import { toggleArrayValue } from "../../ts/dashboard-utils.ts";

describe("Dashboard Utils Logic", () => {
  // Test 1: Kontrollera att ett nytt värde läggs till
  it("ska lägga till ett saknat värde i arrayen", () => {
    const initialArray = ["barn-1"];
    const idToAdd = "barn-2";
    const result = toggleArrayValue(initialArray, idToAdd);
    
    expect(result).toEqual(["barn-1", "barn-2"]);
  });

  // Test 2: Kontrollera att ett existerande värde tas bort
  it("ska ta bort ett existerande värde från arrayen", () => {
    const initialArray = ["barn-1", "barn-2"];
    const idToRemove = "barn-2";
    const result = toggleArrayValue(initialArray, idToRemove);
    
    expect(result).toEqual(["barn-1"]);
  });

  // Test 3: Kontrollera hantering av tomma listor
  it("ska kunna hantera en tom array genom att lägga till värdet", () => {
    const result = toggleArrayValue([], "barn-1");
    expect(result).toEqual(["barn-1"]);
  });
});