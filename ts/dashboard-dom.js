import { toggleArrayValue } from "./dashboard-utils";
export function renderSelectedChildrenText(selectedIds, children, elements) {
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
export function initChildFilter(children, elements) {
    let selectedIds = [];
    elements.filterContainer.addEventListener("change", (event) => {
        const target = event.target;
        if (!target || target.tagName !== "INPUT") {
            return;
        }
        selectedIds = toggleArrayValue(selectedIds, target.value);
        renderSelectedChildrenText(selectedIds, children, elements);
    });
}
