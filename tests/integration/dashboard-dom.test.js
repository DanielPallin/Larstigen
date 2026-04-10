import { describe, test, expect, beforeEach } from "vitest";
import { renderSelectedChildrenText } from "../../ts/dashboard-dom";

describe("renderSelectedChildrenText", () => {
  let selectedChildrenText;
  let pickupSelectedChildrenText;
  let absenceButton;

  const siblings = [
    { id: "1", name: "Eily Pallin" },
    { id: "2", name: "Elfie Pallin" },
  ];

  beforeEach(() => {
    document.body.innerHTML = `
      <p id="selected-children-text"></p>
      <p id="pickup-selected-children"></p>
      <button id="absence-button"></button>
    `;

    selectedChildrenText = document.querySelector("#selected-children-text");
    pickupSelectedChildrenText = document.querySelector("#pickup-selected-children");
    absenceButton = document.querySelector("#absence-button");
  });

  test("visar standardtext när inga barn är valda", () => {
    renderSelectedChildrenText({
      selectedChildren: [],
      siblings,
      selectedChildrenText,
      pickupSelectedChildrenText,
      absenceButton,
    });

    expect(selectedChildrenText.textContent).toBe("Välj barn högst upp först");
    expect(pickupSelectedChildrenText.textContent).toBe("Välj barn högst upp först");
    expect(absenceButton.disabled).toBe(true);
  });

  test("visar valda barn och aktiverar knapp", () => {
    renderSelectedChildrenText({
      selectedChildren: ["1", "2"],
      siblings,
      selectedChildrenText,
      pickupSelectedChildrenText,
      absenceButton,
    });

    expect(selectedChildrenText.textContent).toBe("Valda barn: Eily Pallin, Elfie Pallin");
    expect(pickupSelectedChildrenText.textContent).toBe("Gäller för: Eily Pallin, Elfie Pallin");
    expect(absenceButton.disabled).toBe(false);
  });
});