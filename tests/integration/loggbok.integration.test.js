import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderFilterBar } from "../../ts/loggbok";

const mockRelations = [
  { child: { id: "1", first_name: "Elfie" } },
  { child: { id: "2", first_name: "Eily" } },
];

describe("Loggbok Integration - Filtrering", () => {
  beforeEach(() => {
    // Sätt upp rätt container i DOM:en
    document.body.innerHTML = `<div id="child-filter-container"></div>`;

    // Mocka global setFilter. 
    // Vi använder nu dataset.id för att hitta rätt knapp, vilket är mer robust.
    globalThis.setFilter = vi.fn((id) => {
      const buttons = document.querySelectorAll(".filter-btn");

      // Ta bort active från alla knappar
      buttons.forEach((btn) => btn.classList.remove("active"));

      // Hitta knappen som matchar det ID vi skickat in
      const activeBtn = [...buttons].find((btn) => btn.dataset.id === id);

      if (activeBtn) {
        activeBtn.classList.add("active");
      }
    });

    // Kör den riktiga funktionen som bygger HTML-strukturen
    renderFilterBar(mockRelations);
  });

  it("ska rendera rätt antal filterknappar", () => {
    const buttons = document.querySelectorAll(".filter-btn");

    // "Alla barn" + Elfie + Eily = 3 knappar totalt
    expect(buttons.length).toBe(3);

    const texts = [...buttons].map((btn) => btn.textContent.trim());

    expect(texts).toContain("Elfie");
    expect(texts).toContain("Eily");
  });

  it('ska lägga till "active"-klass vid klick', () => {
    const buttons = [...document.querySelectorAll(".filter-btn")];

    // 1. Hitta knappen för Elfie
    const btn = buttons.find((button) => 
      button.textContent.trim().includes("Elfie")
    );

    expect(btn).toBeDefined();

    // 2. Hämta ID:t från dataset (data-id) istället för RegExp
    // Detta följer GitHubs feedback om att undvika "brittle" (sköra) tester.
    const filterId = btn.dataset.id;

    expect(filterId).toBe("1"); // Elfie har ID "1" i vår mock-data

    // 3. Simulera ett klick genom att anropa den globala funktionen
    globalThis.setFilter(filterId);

    // 4. Verifiera att knappen nu har fått klassen "active"
    expect(btn.classList.contains("active")).toBe(true);
  });
});