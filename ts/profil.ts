import { initGlobalUI } from "./global";
import "/css/global.css";
import "/css/components.css";
import "/css/kalender.css";

// Tells TS what the public holiday API data looks like
interface SvenskDag {
  datum: string;
  veckodag: string;
  "röd dag": "Ja" | "Nej";
  helgdag?: string;
}

// Define the shape of our template data from Supabase
interface ScheduleTemplate {
  id: string;
  name: string;
  is_active: boolean;
}

// --- Application State ---
let currentWeek = 42;
let currentMonth = 3; // 0 = Jan, 3 = April
let currentYear = 2026;

const monthNames = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni", 
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

function setupViewToggles(): void {
  const viewButtons = document.querySelectorAll<HTMLButtonElement>(".view-btn");
  const viewSections = document.querySelectorAll<HTMLElement>(".view-section");

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      viewButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const targetId = button.getAttribute("data-target");

      viewSections.forEach((section) => {
        if (section.id === targetId) {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    });
  });
}

function setupWeekNavigation(): void {
  const btnPrev = document.getElementById("btn-prev-week");
  const btnNext = document.getElementById("btn-next-week");
  const titleDisplay = document.getElementById("week-title-display");

  if (!btnPrev || !btnNext || !titleDisplay) return;

  btnPrev.addEventListener("click", () => {
    // Decrement, but wrap back to 52 if we go below 1
    currentWeek = currentWeek <= 1 ? 52 : currentWeek - 1;
    titleDisplay.textContent = `Vecka ${currentWeek}`;
  });

  btnNext.addEventListener("click", () => {
    // Increment, but wrap back to 1 if we go above 52
    currentWeek = currentWeek >= 52 ? 1 : currentWeek + 1;
    titleDisplay.textContent = `Vecka ${currentWeek}`;
  });
}

function setupMonthNavigation(): void {
  const btnPrev = document.getElementById("btn-prev-month");
  const btnNext = document.getElementById("btn-next-month");
  const titleDisplay = document.getElementById("month-title-display");

  if (!btnPrev || !btnNext || !titleDisplay) return;

  btnPrev.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11; // Wrap to December
      currentYear--;     // Go back a year
    }
    updateMonthDisplay(titleDisplay);
  });

  btnNext.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;  // Wrap to January
      currentYear++;     // Go forward a year
    }
    updateMonthDisplay(titleDisplay);
  });
}

function updateMonthDisplay(titleDisplay: HTMLElement): void {
  // Update the text in the header
  titleDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  // Re-run the generation function with the new state
  generateMonthView(currentYear, currentMonth);
}

function generateMonthView(year: number, month: number): void {
  const grid = document.getElementById("month-grid");
  if (!grid) return;

  // --- THE FLUSH ---
  // Select all existing days and remove them, but leave the M, T, O headers intact!
  const existingDays = grid.querySelectorAll(".month-day");
  existingDays.forEach((day) => day.remove());

  // Step 1: The Math
  const daysInMonth = new Date(year, month + 1, 0).getDate(); 
  const firstDay = new Date(year, month, 1).getDay(); 
  const emptyBlocksToStart = firstDay === 0 ? 6 : firstDay - 1;

  // Step 2: The Painting
  for (let i = 0; i < emptyBlocksToStart; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "month-day empty";
    grid.appendChild(emptyDiv);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "month-day";
    dayDiv.textContent = day.toString();

    // Remove the hardcoded mockup data for now since it only applied to April 2026,
    // or keep the weekend logic as it applies universally!
    const currentWeekday = (emptyBlocksToStart + day - 1) % 7;
    if (currentWeekday === 5 || currentWeekday === 6) { 
      dayDiv.classList.add("weekend");
    }

    grid.appendChild(dayDiv);
  }
}

async function fetchHolidays(year: number, month: number): Promise<void> {
  try {
    // The API requires the month to be formatted with a leading zero (e.g., "04" for April)
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;
    const url = `https://api.dryg.net/dagar/v2.1/${year}/${formattedMonth}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Filter out only the red days!
    const redDays = data.dagar.filter((dag: SvenskDag) => dag["röd dag"] === "Ja" && dag.helgdag);
    
    console.log(`Hittade ${redDays.length} röda dagar i ${year}-${formattedMonth}:`);
    redDays.forEach((dag: SvenskDag) => {
      console.log(`- ${dag.datum}: ${dag.helgdag}`);
    });

  } catch (error) {
    console.error("Kunde inte hämta helgdagar:", error);
  }
}

// Simulated Supabase Fetch
async function fetchAndRenderTemplates(): Promise<void> {
  const container = document.getElementById("template-list");
  if (!container) return;

  // This is your exact data from the Supabase query!
  // In the real version, this will be: const { data } = await supabase.from('schedule_template').select('*');
  const mockSupabaseData: ScheduleTemplate[] = [
    {
      "id": "b817d456-9a6b-4e7c-8b21-26e5f8d9c0b1",
      "name": "Mamma-vecka (Kort fredag)",
      "is_active": false
    },
    {
      "id": "c942e123-8b7a-4c8f-9d32-15f4e7c8b9a0",
      "name": "Standard Arbetsvecka",
      "is_active": true
    }
  ];

  // Clear any existing content
  container.innerHTML = "";

  // Loop through the data and paint it to the screen
  mockSupabaseData.forEach((template) => {
    const card = document.createElement("div");
    card.className = "template-item";
    
    // Check if it's active to render the green badge
    const activeBadgeHTML = template.is_active 
      ? `<span class="badge badge-active">Aktiv Nu</span>` 
      : ``;

    // Redigera button is now a small link-like element in the header.
    // Tillämpa is the main button in the actions div.
    card.innerHTML = `
      <div class="template-header">
        <span class="template-name">
          ${template.name}
          ${activeBadgeHTML}
        </span>
        <button class="btn-edit-header" data-id="${template.id}">Redigera</button>
      </div>
      <div class="template-actions">
        <button class="btn btn-small" data-id="${template.id}">Tillämpa</button>
      </div>
    `;

    container.appendChild(card);
  });
}

async function initPage(): Promise<void> {
  await initGlobalUI();
  setupViewToggles();
  setupWeekNavigation();
  setupMonthNavigation();

  // Fetch and render our templates!
  await fetchAndRenderTemplates();
  
  // Set the initial month view on load
  generateMonthView(currentYear, currentMonth); 

  fetchHolidays(2026, 4); // Testing for April 2026
}

initPage();