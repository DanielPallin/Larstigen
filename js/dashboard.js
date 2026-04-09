const mockData = {
  siblings: [
    
  {
    id: 1,
    name: "Alice",
    avatar: "/assets/child1.jpg",
    color: "blue"
  },
  {
    id: 2,
    name: "Maja",
    avatar: "/assets/child4.jpg",
    color: "yellow"
  ,}
],

  importantUpdates: [
    { id: 1, childId: 1, message: "Skolutflykt på fredag!" },
    { id: 2, childId: 2, message: "Glöm inte att ta med regnkläder imorgon fredag." },
  ],

  upcomingEvents: [
    { id: 1, childId: 1, title: "Föräldramöte", date: "2024-06-10" },
    { id: 2, childId: 2, title: "Skolavslutning", date: "2024-06-20" },
  ],
};

let selectedChildren = [1, 2];
let savedPickup = [];

const childFilter = document.querySelector("#child-filter");
const importantUpdatesList = document.querySelector("#important-updates");
const upcomingEventsList = document.querySelector("#upcoming-events");
const pickupSelectedChildrenText = document.querySelector("#pickup-selected-children"); 

const pickupForm = document.querySelector("#pickup-form");
const pickupNameInput = document.querySelector("#pickup-name");
const pickupResults = document.querySelector("#pickup-results");

const absenceForm = document.querySelector("#absence-form");
const absenceDateInput = document.querySelector("#absence-date");
const absenceButton = document.querySelector("#absence-button");
const selectedChildrenText = document.querySelector("#selected-children-text");

function getChildById(id) {
  return mockData.siblings.find((child) => child.id === id);
}

function toggleArrayValue(arr, id) {
  return arr.includes(id)
    ? arr.filter((item) => item !== id)
    : [...arr, id];
}

function getFilteredUpdates() {
  if (selectedChildren.length === 0) return mockData.importantUpdates;
  return mockData.importantUpdates.filter((update) =>
    selectedChildren.includes(update.childId)
  );
}

function getFilteredUpcoming() {
  if (selectedChildren.length === 0) return mockData.upcomingEvents;
  return mockData.upcomingEvents.filter((event) =>
    selectedChildren.includes(event.childId)
  );
}

function createChildCard(sibling, checked, onToggle) {
  const label = document.createElement("label");
  label.className = `sibling-card selectable sibling-${sibling.color}${checked ? " active" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;

  checkbox.addEventListener("change", (event) => {
    event.stopPropagation();
    onToggle(sibling.id);
  });

  label.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "input") return;
    onToggle(sibling.id);
  });

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = sibling.avatar;
  avatar.alt = sibling.name;

  const text = document.createElement("p");
  text.textContent = `${sibling.name}`;

  label.append(checkbox, avatar, text);
  return label;
}

function renderChildFilter() {
  childFilter.innerHTML = "";

  mockData.siblings.forEach((sibling) => {
    const card = createChildCard(
      sibling,
      selectedChildren.includes(sibling.id),
      (id) => {
        selectedChildren = toggleArrayValue(selectedChildren, id);
        renderAll();
      }
    );
    childFilter.appendChild(card);
  });
}

function renderSelectedChildrenText() {
  const hasSelection = selectedChildren.length > 0;

  if (!hasSelection) {
    selectedChildrenText.textContent = "Välj barn högst upp först";            
    pickupSelectedChildrenText.textContent = "Välj barn högst upp först";
    absenceButton.disabled = true;
    return;
  }

  const names = mockData.siblings
    .filter((child) => selectedChildren.includes(child.id))
    .map((child) => child.name)
    .join(", ");

  selectedChildrenText.textContent = `Valda barn: ${names}`;
  pickupSelectedChildrenText.textContent = `Gäller för: ${names}`;
  absenceButton.disabled = false;
}

function renderUpdates() {
  importantUpdatesList.innerHTML = "";

  const filteredUpdates = getFilteredUpdates();

  if (filteredUpdates.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Inga viktiga uppdateringar för valt barn.";
    importantUpdatesList.appendChild(li);
    return;
  }

  filteredUpdates.forEach((update) => {
    const child = getChildById(update.childId);
    if (!child) return;

    const li = document.createElement("li");
    li.className = `notice-item notice-${child.color}`;

    const tag = document.createElement("span");
    tag.className = `child-tag child-tag-${child.color}`;
    tag.textContent = child.name;

    const text = document.createElement("span");
    text.className = "notice-text";
    text.textContent = update.message;

    li.append(tag, text);
    importantUpdatesList.appendChild(li);
  });
}

function renderUpcoming() {
  upcomingEventsList.innerHTML = "";

  const filteredUpcoming = getFilteredUpcoming();

  if (filteredUpcoming.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Inga kommande händelser för valt barn.";
    upcomingEventsList.appendChild(li);
    return;
  }

  filteredUpcoming.forEach((event) => {
    const child = getChildById(event.childId);
    if (!child) return;

    const li = document.createElement("li");
    li.className = `event-item event-${child.color}`;

    const tag = document.createElement("span");
    tag.className = `child-tag child-tag-${child.color}`;
    tag.textContent = child.name;

    const text = document.createElement("span");
    text.className = "event-text";
    text.textContent = `${event.date} - ${event.title}`;

    li.append(tag, text);
    upcomingEventsList.appendChild(li);
  });
}

function renderPickupResults() {
  pickupResults.innerHTML = "";

  savedPickup.forEach((entry) => {
    const child = getChildById(entry.childId);
    if (!child) return;

    const p = document.createElement("p");
    p.className = `saved-pickup child-${child.color}`;
    p.textContent = `${child.name}: ${entry.name}`;
    pickupResults.appendChild(p);
  });
}

pickupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const pickupName = pickupNameInput.value.trim();
  if (!pickupName || selectedChildren.length === 0) return;        

  const newEntries = selectedChildren.map((childId) => ({
    childId,
    name: pickupName,
  }));

  savedPickup = [...newEntries];
  pickupNameInput.value = "";

  renderPickupResults();
});


absenceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (selectedChildren.length === 0 || !absenceDateInput.value) return;

  const names = mockData.siblings
    .filter((child) => selectedChildren.includes(child.id))
    .map((child) => child.name)
    .join(", ");

  alert(`Frånvaro anmäld för: ${names}\nDatum: ${absenceDateInput.value}`);
  absenceDateInput.value = "";
});

function renderAll() {                                  
  renderChildFilter();
  renderUpdates();
  renderUpcoming();
  renderSelectedChildrenText();
  renderPickupResults();
}
renderAll();