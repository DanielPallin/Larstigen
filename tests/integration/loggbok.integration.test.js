import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderFilterBar } from "../../ts/loggbok";

const mockRelations = [
  { child: { id: "1", first_name: "Elfie" } },
  { child: { id: "2", first_name: "Eily" } },
];

describe("Loggbok Integration - Filtrering", () => {
  beforeEach(() => {
    // Sätt upp rätt container
    document.body.innerHTML = `<div id="child-filter-container"></div>`;

    // Mocka global setFilter (som HTML:en använder via onclick)
    globalThis.setFilter = vi.fn((id) => {
      const buttons = document.querySelectorAll(".filter-btn");

      // Ta bort active från alla
      buttons.forEach((btn) => btn.classList.remove("active"));

      // Hitta knappen som har detta ID i sitt onclick-attribut
      const activeBtn = [...buttons].find((btn) => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        return onclickAttr.includes(`'${id}'`);
      });

      if (activeBtn) activeBtn.classList.add("active");
    });

    // Kör den riktiga funktionen från din källkod
    renderFilterBar(mockRelations);
  });

  it("ska rendera rätt antal filterknappar", () => {
    const buttons = document.querySelectorAll(".filter-btn");

    // "Alla barn" + Elfie + Eily = 3 knappar
    expect(buttons.length).toBe(3);

    const texts = [...buttons].map((btn) => btn.textContent.trim());

    expect(texts).toContain("Elfie");
    expect(texts).toContain("Eily");
  });

  it('ska lägga till "active"-klass vid klick', () => {
    const buttons = [...document.querySelectorAll(".filter-btn")];

    // 1. Hitta knappen via text (eftersom vi vet att den skapas så)
    const btn = buttons.find((button) => 
      button.textContent.trim().includes("Elfie")
    );

    expect(btn).toBeDefined();

    // 2. Hämta ID:t från onclick-attributet (eftersom data-id saknas i din HTML)
    const onclickAttr = btn.getAttribute("onclick");
    expect(onclickAttr).toContain("setFilter");

    // Extrahera ID:t (strängen mellan enkla citationstecken)
    const match = onclickAttr.match(/'([^']+)'/);
    const filterId = match ? match[1] : null;

    expect(filterId).toBe("1"); // Elfie har ID "1" i vår mock-data

    // 3. Simulera anropet som onclick skulle gjort
    globalThis.setFilter(filterId);

    // 4. Verifiera att knappen nu har fått klassen "active"
    expect(btn.classList.contains("active")).toBe(true);
  });
});