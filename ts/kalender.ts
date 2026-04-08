import { initGlobalUI } from "./global";
import { supabase } from './api';
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
  child_id: string;
  name: string;
  is_active: boolean;
  created_at: string; // Supabase returns timestamps as ISO strings
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

async function applyTemplate(templateId: string, childId: string): Promise<void> {
  try {
    // 1. Bulk Deactivation: Turn off all templates for this child
    const { error: resetError } = await supabase
      .from('schedule_template')
      .update({ is_active: false })
      .eq('child_id', childId);

    if (resetError) throw resetError;

    // 2. Targeted Activation: Turn on the selected template
    const { error: activateError } = await supabase
      .from('schedule_template')
      .update({ is_active: true })
      .eq('id', templateId);

    if (activateError) throw activateError;

    // 3. Refresh the UI to show the new "Aktiv Nu" badge
    await fetchAndRenderTemplates();

  } catch (error) {
    console.error("Kunde inte tillämpa mallen:", error);
    alert("Ett fel uppstod när mallen skulle aktiveras. Försök igen.");
  }
}

async function fetchAndRenderTemplates(): Promise<void> {
  const container = document.getElementById("template-list");
  if (!container) return;

  container.innerHTML = `<p class="subtitle">Hämtar dina rullande scheman...</p>`;

  try {
    // Fetch the data
    const { data, error } = await supabase
      .from('schedule_template')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error fetching templates:", error);
      container.innerHTML = `<p class="subtitle" style="color: red;">Ett fel uppstod när scheman skulle laddas. Vänligen försök igen.</p>`;
      return;
    }

    // CAST THE DATA! 
    // This tells TypeScript: "Trust me, this data is an array of ScheduleTemplates"
    const scheduleTemplates = data as ScheduleTemplate[];

    if (!scheduleTemplates || scheduleTemplates.length === 0) {
      container.innerHTML = `<p class="subtitle">Du har inga sparade mallar ännu.</p>`;
      return;
    }

    container.innerHTML = "";

    // Now, when you type `template.`, your IDE will auto-suggest 
    // .id, .child_id, .name, .is_active, and .created_at!
    scheduleTemplates.forEach((template) => {
      const card = document.createElement("div");
      card.className = "template-item";
      
      const activeBadgeHTML = template.is_active 
        ? `<span class="badge badge-active">Aktiv Nu</span>` 
        : ``;

      card.innerHTML = `
        <div class="template-header">
          <span class="template-name">
            ${template.name}
            ${activeBadgeHTML}
          </span>
          <button class="btn-edit-header" data-id="${template.id}">Redigera</button>
        </div>
        <div class="template-actions">
          <button class="btn btn-small btn-apply" data-id="${template.id}">
            ${template.is_active ? 'Vald' : 'Tillämpa'}
          </button>
        </div>
      `;

      container.appendChild(card);

      // --- NEW: Add Event Listener to the newly created button ---
      const applyBtn = card.querySelector('.btn-apply') as HTMLButtonElement;
      
      // If it's already active, we can disable the button to prevent redundant DB calls
      if (template.is_active) {
        applyBtn.disabled = true;
        applyBtn.style.opacity = "0.6"; // Visual cue that it's disabled
        applyBtn.style.cursor = "default";
      } else {
        applyBtn.addEventListener('click', async () => {
          // UX touch: Give instant feedback that something is happening
          applyBtn.textContent = "Uppdaterar...";
          applyBtn.style.opacity = "0.7";
          await applyTemplate(template.id, template.child_id);
        });
      }
    });

  } catch (err) {
    console.error("Network error:", err);
    container.innerHTML = `<p class="subtitle" style="color: red;">Kunde inte ansluta till servern. Kontrollera din uppkoppling.</p>`;
  }
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