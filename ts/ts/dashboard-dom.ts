type Child = {
  id: string;
  name: string;
};

type RenderSelectedChildrenTextParams = {
  selectedChildren: string[];
  siblings: Child[];
  selectedChildrenText: HTMLParagraphElement;
  pickupSelectedChildrenText: HTMLParagraphElement;
  absenceButton: HTMLButtonElement;
};

export function renderSelectedChildrenText({
  selectedChildren,
  siblings,
  selectedChildrenText,
  pickupSelectedChildrenText,
  absenceButton,
}: RenderSelectedChildrenTextParams): void {
  const hasSelection = selectedChildren.length > 0;

  if (!hasSelection) {
    selectedChildrenText.textContent = "Välj barn högst upp först";
    pickupSelectedChildrenText.textContent = "Välj barn högst upp först";
    absenceButton.disabled = true;
    return;
  }

  const names = siblings
    .filter((child) => selectedChildren.includes(child.id))
    .map((child) => child.name)
    .join(", ");

  selectedChildrenText.textContent = `Valda barn: ${names}`;
  pickupSelectedChildrenText.textContent = `Gäller för: ${names}`;
  absenceButton.disabled = false;
}