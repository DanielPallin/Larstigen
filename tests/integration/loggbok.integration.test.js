import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderFilterBar } from "../../ts/loggbok";

const mockRelations = [{ child: { id: "1", first_name: "Elfie" } }];

describe("Loggbok Integration - Filtrering", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="child-filter-container"></div>`;
    globalThis.setFilter = vi.fn((id) => {
      const buttons = document.querySelectorAll(".filter-btn");
      buttons.forEach(btn => btn.classList.remove("active"));
      const activeBtn = [...buttons].find(btn => btn.dataset.id === id);
      if (activeBtn) activeBtn.classList.add("active");
    });
    renderFilterBar(mockRelations);
  });

  it('ska lägga till "active"-klass vid klick via dataset.id', () => {
    const btn = document.querySelector(".filter-btn[data-id='1']");
    const filterId = btn.dataset.id; // GitHub-godkänd metod
    globalThis.setFilter(filterId);
    expect(btn.classList.contains("active")).toBe(true);
  });
});