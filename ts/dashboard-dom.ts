import { toggleArrayValue } from "./dashboard-utils";

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
}

export interface DashboardElements {
  filterContainer: HTMLElement;
  selectedText: HTMLElement;
  pickupText: HTMLElement;
  absenceBtn: HTMLButtonElement;
}

export function renderSelectedChildrenText(
  selectedIds: string[],
  children: Child[],
  elements: Omit<DashboardElements, "filterContainer">
): void {
  const hasSelection = selectedIds.length > 0;

  const names = children
    .filter((child) => selectedIds.includes(child.id))
    .map((child) => child.first_name)
    .join(", ");

  elements.selectedText.textContent = hasSelection
    ? `Valda barn: ${names}`
    : "Välj barn högst upp först";

  elements.pickupText.textContent = hasSelection
    ? `Gäller för: ${names}`
    : "Välj barn högst upp först";

  elements.absenceBtn.disabled = !hasSelection;
}

export function initChildFilter(
  children: Child[],
  elements: DashboardElements
): void {
  let selectedIds: string[] = [];

  elements.filterContainer.addEventListener("change", (event: Event) => {
    const target = event.target as HTMLInputElement | null;

    if (!target || target.tagName !== "INPUT") {
      return;
    }

    selectedIds = toggleArrayValue(selectedIds, target.value);
    renderSelectedChildrenText(selectedIds, children, elements);
  });
}