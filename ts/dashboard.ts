console.log("dashboard.ts laddad");
import { supabase } from "./api";
import { initGlobalUI } from "./global";
import "/css/global.css";
import "/css/components.css";
import "/css/dashboard.css";

type ChildColor = "blue" | "yellow" | "green" | "red";

const DEFAULT_ABSENCE_TYPE_ID = "0c6b9018-16b2-419a-b7d7-d6642fef2940"; // Tillfälligt hårdkodad standardtyp

interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface ChildRow {
  id: string;
  department_id: string | null;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
  is_active: boolean;
}

interface ChildCaregiverRow {
  child_id: string;
  caregiver_id: string;
  can_pick_up: boolean;
  receives_notifications: boolean;
  child: ChildRow | null;
}

interface Sibling {
  id: string;
  name: string;
  avatar: string | null;
  color: ChildColor;
  departmentId: string | null;
  departmentName: string | null;
}

interface NoticeRow {
  id: string;
  department_id: string | null;
  info_id: string | null;
  title: string | null;
  created_at: string;
  is_active: boolean;
}

interface InfoRow {
  id: string;
  department_id: string | null;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  is_published: boolean;
  event_date: string | null;
}

interface ImportantUpdateItem {
  id: string;
  childId: string;
  title: string;
  message: string;
  createdAt: string;
}

interface ScheduleEntryRow {
  id: string;
  child_id: string;
  date: string;
  drop_off_time: string | null;
  pick_up_time: string | null;
  comment: string | null;
  created_at: string;
}

interface UpcomingItem {
  id: string;
  childId: string;
  title: string;
  date: string;
}

interface PickupEntry {
  childId: string;
  name: string;
}

interface DashboardState {
  siblings: Sibling[];
  importantUpdates: ImportantUpdateItem[];
  upcomingEvents: UpcomingItem[];
}

const state: DashboardState = {
  siblings: [],
  importantUpdates: [],
  upcomingEvents: [],
};

let selectedChildren: string[] = [];
let savedPickup: PickupEntry[] = [];

// DOM
const childFilter = document.querySelector("#child-filter") as HTMLDivElement | null;
const importantUpdatesList = document.querySelector("#important-updates") as HTMLUListElement | null;
const upcomingEventsList = document.querySelector("#upcoming-events") as HTMLUListElement | null;
const pickupSelectedChildrenText = document.querySelector("#pickup-selected-children") as HTMLParagraphElement | null;

const pickupForm = document.querySelector("#pickup-form") as HTMLFormElement | null;
const pickupNameInput = document.querySelector("#pickup-name") as HTMLInputElement | null;
const pickupResults = document.querySelector("#pickup-results") as HTMLDivElement | null;

const absenceForm = document.querySelector("#absence-form") as HTMLFormElement | null;
const absenceDateInput = document.querySelector("#absence-date") as HTMLInputElement | null;
const absenceButton = document.querySelector("#absence-button") as HTMLButtonElement | null;
const selectedChildrenText = document.querySelector("#selected-children-text") as HTMLParagraphElement | null;

// Helpers
function getColorByIndex(index: number): ChildColor {
  const colors: ChildColor[] = ["blue", "yellow", "green", "red"];
  return colors[index % colors.length];
}

function getChildById(id: string): Sibling | undefined {
  return state.siblings.find((child) => child.id === id);
}


function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("sv-SE");
}

function formatTime(timeString: string | null): string {
  if (!timeString) return "";
  return timeString.slice(0, 5);
}

function getFilteredUpdates(): ImportantUpdateItem[] {
  if (selectedChildren.length === 0) return state.importantUpdates;
  return state.importantUpdates.filter((update) =>
    selectedChildren.includes(update.childId)
  );
}

function getFilteredUpcoming(): UpcomingItem[] {
  if (selectedChildren.length === 0) return state.upcomingEvents;
  return state.upcomingEvents.filter((event) =>
    selectedChildren.includes(event.childId)
  );
}

async function getAvatarUrl(fileName: string | null): Promise<string | null> {
  if (!fileName) return null;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(fileName, 3600);

  if (error) {
    console.error(`Kunde inte hämta bild ${fileName}:`, error.message);
    return null;
  }

  return data?.signedUrl || null;
}

// Data fetching
async function getLoggedInCaregiver(): Promise<Caregiver> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "/index.html";
    throw new Error("Ingen aktiv session.");
  }

  let userEmail = session.user.email || "";

  // Behåll samma testlogik som i gruppens kod
  if (userEmail === "test@test.test") {
    userEmail = "daniel.pallin@example.se";
  }

  const { data, error } = await supabase
    .from("caregiver")
    .select("id, first_name, last_name, email")
    .eq("email", userEmail)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Kunde inte hitta vårdnadshavare i databasen.");
  }

  return data as Caregiver;
}

async function fetchDepartments(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("department")
    .select("id, name");

  if (error) {
    throw new Error(`Kunde inte hämta avdelningar: ${error.message}`);
  }

  const map = new Map<string, string>();
  (data || []).forEach((dep) => {
    map.set(dep.id, dep.name);
  });

  return map;
}

async function fetchSiblings(caregiverId: string): Promise<Sibling[]> {
  const departmentMap = await fetchDepartments();

  const { data, error } = await supabase
    .from("child_caregiver")
    .select(`
      child_id,
      caregiver_id,
      can_pick_up,
      receives_notifications,
      child (
        id,
        department_id,
        first_name,
        last_name,
        profile_image_url,
        is_active
      )
    `)
    .eq("caregiver_id", caregiverId);

  if (error) {
    throw new Error(`Kunde inte hämta barn: ${error.message}`);
  }

  const rows = (data || []) as unknown as ChildCaregiverRow[];

  const activeRows = rows.filter((row) => row.child && row.child.is_active);

  const siblings: Sibling[] = await Promise.all(
    activeRows.map(async (row, index) => {
      const child = row.child as ChildRow;
      const avatarUrl = await getAvatarUrl(child.profile_image_url);

      return {
        id: child.id,
        name: `${child.first_name} ${child.last_name}`.trim(),
        avatar: avatarUrl,
        color: getColorByIndex(index),
        departmentId: child.department_id,
        departmentName: child.department_id
          ? departmentMap.get(child.department_id) || null
          : null,
      };
    })
  );

  return siblings;
}

async function fetchImportantUpdates(siblings: Sibling[]): Promise<ImportantUpdateItem[]> {
  const departmentIds = Array.from(
    new Set(
      siblings
        .map((s) => s.departmentId)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (departmentIds.length === 0) return [];

  const { data: noticeData, error: noticeError } = await supabase
    .from("notice")
    .select("id, department_id, info_id, title, created_at, is_active")
    .in("department_id", departmentIds)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (noticeError) {
    console.error("Kunde inte hämta notices:", noticeError.message);
    return [];
  }

  const notices = (noticeData || []) as NoticeRow[];
  const infoIds = notices
    .map((notice) => notice.info_id)
    .filter((id): id is string => Boolean(id));

  let infoMap = new Map<string, InfoRow>();

  if (infoIds.length > 0) {
    const { data: infoData, error: infoError } = await supabase
      .from("info")
      .select("id, department_id, title, content, created_at, updated_at, is_published, event_date")
      .in("id", infoIds)
      .eq("is_published", true);

    if (infoError) {
      console.error("Kunde inte hämta info:", infoError.message);
    } else {
      infoMap = new Map(
        ((infoData || []) as InfoRow[]).map((info) => [info.id, info])
      );
    }
  }

  const updates: ImportantUpdateItem[] = [];

  siblings.forEach((child) => {
    const childDepartmentNotices = notices.filter(
      (notice) => notice.department_id === child.departmentId
    );

    childDepartmentNotices.forEach((notice) => {
      const linkedInfo = notice.info_id ? infoMap.get(notice.info_id) : undefined;

      const title = linkedInfo?.title || notice.title || "Information";
      const message =
        linkedInfo?.content ||
        notice.title ||
        "Ingen ytterligare information tillgänglig.";

      updates.push({
        id: notice.id,
        childId: child.id,
        title,
        message,
        createdAt: linkedInfo?.created_at || notice.created_at,
      });
    });
  });

  // sortera senast först
  updates.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return updates;
}

async function fetchUpcomingEvents(childIds: string[]): Promise<UpcomingItem[]> {
  if (childIds.length === 0) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("schedule_entry")
    .select("id, child_id, date, drop_off_time, pick_up_time, comment, created_at")
    .in("child_id", childIds)
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    console.error("Kunde inte hämta schema:", error.message);
    return [];
  }

  const rows = (data || []) as ScheduleEntryRow[];

  return rows.map((row) => {
    const hasTimes = row.drop_off_time || row.pick_up_time;
    const timeText = hasTimes
      ? `${formatTime(row.drop_off_time)}–${formatTime(row.pick_up_time)}`
      : "Schema";

    const title = row.comment?.trim()
      ? `${timeText} · ${row.comment}`
      : timeText;

    return {
      id: row.id,
      childId: row.child_id,
      title,
      date: row.date,
    };
  });
}

// Render
function createChildCard(
  sibling: Sibling,
  checked: boolean,
  onToggle: (id: string) => void
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = `sibling-card selectable sibling-${sibling.color}${checked ? " active" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;

  checkbox.addEventListener("change", () => {
    onToggle(sibling.id);
  });

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = sibling.avatar || "/assets/child1.jpg";
  avatar.alt = sibling.name;

  const text = document.createElement("p");
  text.textContent = sibling.name;

  label.append(checkbox, avatar, text);
  return label;
}

function renderChildFilter(): void {
  if (!childFilter) return;

  childFilter.innerHTML = "";

  state.siblings.forEach((sibling) => {
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

function renderSelectedChildrenText(): void {
  if (!selectedChildrenText || !pickupSelectedChildrenText || !absenceButton) return;

  const hasSelection = selectedChildren.length > 0;

  if (!hasSelection) {
    selectedChildrenText.textContent = "Välj barn högst upp först";
    pickupSelectedChildrenText.textContent = "Välj barn högst upp först";
    absenceButton.disabled = true;
    return;
  }

  const names = state.siblings
    .filter((child) => selectedChildren.includes(child.id))
    .map((child) => child.name)
    .join(", ");

  selectedChildrenText.textContent = `Valda barn: ${names}`;
  pickupSelectedChildrenText.textContent = `Gäller för: ${names}`;
  absenceButton.disabled = false;
}

function renderUpdates(): void {
  if (!importantUpdatesList) return;

  importantUpdatesList.innerHTML = "";

  const filteredUpdates = getFilteredUpdates();

  if (filteredUpdates.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Ingen viktig information för valt barn.";
    importantUpdatesList.appendChild(li);
    return;
  }

  filteredUpdates.forEach((update) => {
    const child = getChildById(update.childId);
    if (!child) return;

    const li = document.createElement("li");
    li.className = `notice-item notice-${child.color} clickable`;

    li.addEventListener("click", () => {
      window.location.href = `/information.html?childId=${child.id}&noticeId=${update.id}`;
    });

    const tag = document.createElement("span");
    tag.className = `child-tag child-tag-${child.color}`;
    tag.textContent = child.name;

    const textWrap = document.createElement("div");

    const title = document.createElement("strong");
    title.className = "notice-title";
    title.textContent = update.title;

    const text = document.createElement("span");
    text.className = "notice-text";
    text.textContent = update.message;

    textWrap.append(title, document.createElement("br"), text);
    li.append(tag, textWrap);
    importantUpdatesList.appendChild(li);
  });
}

function renderUpcoming(): void {
  if (!upcomingEventsList) return;

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
    text.textContent = `${formatDate(event.date)} - ${event.title}`;

    li.append(tag, text);
    upcomingEventsList.appendChild(li);
  });
}

function renderPickupResults(): void {
  if (!pickupResults) return;

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

function renderAll(): void {
  renderChildFilter();
  renderUpdates();
  renderUpcoming();
  renderSelectedChildrenText();
  renderPickupResults();
}

// Forms
function initPickupForm(): void {
  if (!pickupForm || !pickupNameInput) return;

  pickupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const pickupName = pickupNameInput.value.trim();
    if (!pickupName || selectedChildren.length === 0) return;

    const newEntries = selectedChildren.map((childId) => ({
      childId,
      name: pickupName,
    }));

    const otherPickups = savedPickup.filter(
      (entry) => !selectedChildren.includes(entry.childId)
    );

    savedPickup = [...otherPickups, ...newEntries];
    pickupNameInput.value = "";

    renderPickupResults();
  });
}

function initAbsenceForm(caregiverId: string): void {
  if (!absenceForm || !absenceDateInput) return;

  absenceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (selectedChildren.length === 0 || !absenceDateInput.value) return;

    const dateValue = absenceDateInput.value;

    const rows = selectedChildren.map((childId) => ({
    reported_by_caregiver_id: caregiverId,
    child_id: childId,
    absence_type_id: DEFAULT_ABSENCE_TYPE_ID,
    start_date: dateValue,
    end_date: dateValue,
    comment: null,
  }));

    const { error } = await supabase.from("absence").insert(rows);

    if (error) {
      console.error("Kunde inte spara frånvaro:", error.message);
      return;
    }

    absenceDateInput.value = "";
  });
}

// Init
async function initDashboard(): Promise<void> {
  await initGlobalUI();

  try {
    const caregiver = await getLoggedInCaregiver();
    const siblings = await fetchSiblings(caregiver.id);

    state.siblings = siblings;
    selectedChildren = siblings.map((child) => child.id);

    const childIds = siblings.map((child) => child.id);

    const [importantUpdates, upcomingEvents] = await Promise.all([
      fetchImportantUpdates(siblings),
      fetchUpcomingEvents(childIds),
    ]);

    state.importantUpdates = importantUpdates;
    state.upcomingEvents = upcomingEvents;

    console.log("siblings:", state.siblings);
    console.log("importantUpdates:", state.importantUpdates);
    console.log("upcomingEvents:", state.upcomingEvents);

    initPickupForm();
    initAbsenceForm(caregiver.id);
    renderAll();
  } catch (err: unknown) {
    console.error(err);

    const message =
      err instanceof Error ? err.message : "Ett oväntat fel uppstod.";

    if (importantUpdatesList) {
      importantUpdatesList.innerHTML = `<li>${message}</li>`;
    }
  }
}
export function toggleArrayValue(arr: string[], id: string): string[] {
  return arr.includes(id)
    ? arr.filter((item) => item !== id)
    : [...arr, id];
}

initDashboard();