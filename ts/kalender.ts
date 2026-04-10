import { initGlobalUI } from "./global";
import { supabase } from './api';
import { getDatesOfWeek } from './utils'
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

// Define the shape of our returning holiday data
interface PublicHoliday {
  datum: string;
  helgdag: string;
}

// Define the shape of our preschool info events
interface InfoEvent {
  id: string;
  title: string;
  content: string;
  event_date: string; // YYYY-MM-DD
}

// Define the shape of our template data from Supabase
interface ScheduleTemplate {
  id: string;
  child_id: string;
  name: string;
  is_active: boolean;
  created_at: string; // Supabase returns timestamps as ISO strings
}

// Define the shape of our concrete schedule entries
interface ScheduleEntry {
  id: string;
  child_id: string;
  date: string;
  drop_off_time: string;
  pick_up_time: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
}

// --- Application State ---
let currentWeek = 16; // Change this from 42 to 16
let currentMonth = 3; // 0 = Jan, 3 = April
let currentYear = 2026;

const monthNames = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni", 
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

// VIEW AND NAVIGATION FUNCTIONS
export function setupViewToggles(): void {
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

      // When the user clicks the "Schema" button, fetch the data!
      if (targetId === "view-schema") {
        // We use your mock child ID here for testing
        fetchAndRenderWeeklySchedule("03974556-db9a-448b-a3a0-a8d4aa1fc498"); 
      }
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

// WEEKLY VIEW FUNCTIONS
async function fetchAndRenderWeeklySchedule(childId: string): Promise<void> {
  const container = document.getElementById("view-schema");
  if (!container) return;

  // 1. Calculate dynamic dates based on the global state
  const { start: weekStart, end: weekEnd } = getDatesOfWeek(currentWeek, currentYear);

  container.innerHTML = `<div class="card full-width"><p class="subtitle" style="text-align: center;">Hämtar vecka ${currentWeek}...</p></div>`;

  try {
    const { data, error } = await supabase
      .from('schedule_entry')
      .select('*')
      .eq('child_id', childId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date', { ascending: true });

    if (error) throw error;

    const entries = data as ScheduleEntry[];

    // 2. Build the Header with Navigation Buttons
    let html = `
      <div class="card full-width">
        <div class="week-header">
          <button class="btn btn-small" id="btn-prev-week-schema">◀</button>
          <h3 class="card-title week-title" style="margin: 0 15px;">Vecka ${currentWeek}</h3>
          <button class="btn btn-small" id="btn-next-week-schema">▶</button>
        </div>
    `;

    // 3. Handle Empty State
    if (!entries || entries.length === 0) {
      html += `<p class="subtitle" style="text-align: center; margin-top: 15px;">Inget schema inlagt för denna vecka.</p></div>`;
    } else {
      // 4. Render Days
      entries.forEach(entry => {
        let statusIcon = '⏳';
        let statusText = 'Väntar';
        let statusColor = 'var(--text-muted)';
        
        if (entry.approval_status === 'approved') {
          statusIcon = '✅';
          statusText = 'Bekräftad';
          statusColor = 'var(--primary-green)';
        } else if (entry.approval_status === 'rejected') {
          statusIcon = '❌';
          statusText = 'Nekad';
          statusColor = '#e74c3c';
        }

        const dropOff = entry.drop_off_time ? entry.drop_off_time.substring(0, 5) : '-';
        const pickUp = entry.pick_up_time ? entry.pick_up_time.substring(0, 5) : '-';
        const dayName = new Date(entry.date).toLocaleDateString('sv-SE', { weekday: 'short' }).toUpperCase();

        html += `
          <div class="day-row" style="justify-content: space-between;">
            <div style="display: flex; gap: 15px; align-items: center;">
              <div class="day-name">${dayName}</div>
              <div class="time-display" style="font-weight: bold;">
                ${dropOff} - ${pickUp}
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
              <div class="status-indicator" style="color: ${statusColor}; font-size: 0.9rem;" title="Status: ${entry.approval_status}">
                ${statusIcon} ${statusText}
              </div>
              <button class="btn-edit-header btn-edit-exception" data-id="${entry.id}" data-date="${entry.date}">Redigera</button>
            </div>

          </div>
          ${entry.comment ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-left: 55px; margin-bottom: 10px;">💬 ${entry.comment}</div>` : ''}
        `;
      });
      html += `</div>`;
    }

    container.innerHTML = html;

    // 5. Attach Event Listeners to the newly created buttons
    document.getElementById("btn-prev-week-schema")?.addEventListener("click", () => {
      currentWeek--;
      if (currentWeek < 1) {
        currentWeek = 52;
        currentYear--;
      }
      fetchAndRenderWeeklySchedule(childId);
    });

    document.getElementById("btn-next-week-schema")?.addEventListener("click", () => {
      currentWeek++;
      if (currentWeek > 52) {
        currentWeek = 1;
        currentYear++;
      }
      fetchAndRenderWeeklySchedule(childId);
    });
  } catch (error) {
    console.error("Kunde inte hämta veckoschemat:", error);
    container.innerHTML = `<div class="card full-width"><p class="subtitle" style="color: red; text-align: center;">Kunde inte ladda schemat.</p></div>`;
  }
}

// MONTHLY CALENDAR FUNCTIONS
async function updateMonthDisplay(titleDisplay: HTMLElement): Promise<void> {
  // Update the text in the header
  titleDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  // Re-run the generation function with the new state
  await generateMonthView(currentYear, currentMonth);
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

async function fetchInfoEvents(year: number, month: number): Promise<InfoEvent[]> {
  // JavaScript months are 0-indexed, so we add 1 and pad with '0' (e.g., '04' for April)
  const paddedMonth = String(month + 1).padStart(2, '0');
  
  // First day of the month
  const startDate = `${year}-${paddedMonth}-01`;
  
  // Last day of the month (Date object trick: day 0 of the next month is the last day of the current month)
  const endOfMonthDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${paddedMonth}-${endOfMonthDay}`;

  const { data, error } = await supabase
    .from('info')
    .select('id, title, content, event_date')
    .not('event_date', 'is', null)
    .gte('event_date', startDate)
    .lte('event_date', endDate);

  if (error) {
    console.error("Kunde inte hämta händelser från Supabase:", error);
    return [];
  }

  return data as InfoEvent[];
}

async function fetchHolidays(year: number, month: number): Promise<PublicHoliday[]> {
  try {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const url = `https://api.dryg.net/dagar/v2.1/${year}/${paddedMonth}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Return an array of objects containing both the date and the name
    return data.dagar
      .filter((dag: SvenskDag) => dag["röd dag"] === "Ja" && dag.helgdag)
      .map((dag: SvenskDag) => ({
        datum: dag.datum,
        helgdag: dag.helgdag
      }));

  } catch (error) {
    console.error("Kunde inte hämta helgdagar:", error);
    return [];
  }
}

async function generateMonthView(year: number, month: number): Promise<void> {
  const grid = document.getElementById("month-grid");
  if (!grid) return;

  // --- NEW: Flush the details container when the month changes ---
  const detailsContainer = document.getElementById("day-details-container");
  if (detailsContainer) {
    detailsContainer.innerHTML = "";
  }

  // Visual feedback while fetching
  grid.style.opacity = "0.5"; 

  // --- THE FETCH ---
  // Promise.all runs both fetches at the exact same time for maximum speed
  const [holidays, infoEvents] = await Promise.all([
    fetchHolidays(year, month),
    fetchInfoEvents(year, month)
  ]);

  // --- THE FLUSH ---
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

  const paddedMonth = String(month + 1).padStart(2, '0');

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "month-day";
    dayDiv.textContent = day.toString();

    const paddedDay = String(day).padStart(2, '0');
    const currentDateString = `${year}-${paddedMonth}-${paddedDay}`;
    const currentWeekday = (emptyBlocksToStart + day - 1) % 7;
    
    // Create an array to hold all hover texts for this specific day
    let tooltipTexts: string[] = [];

    // 1. Check for Public Holiday (Röd dag)
    const holiday = holidays.find(h => h.datum === currentDateString);
    if (holiday) {
      tooltipTexts.push(holiday.helgdag); // Add the holiday name to the tooltip
    }

    // Apply red/transparent styling for weekends and holidays
    if (currentWeekday === 5 || currentWeekday === 6 || holiday) { 
      dayDiv.classList.add("weekend"); 
    }

    // 2. Check for Pre-school Events
    const daysEvents = infoEvents.filter(e => e.event_date === currentDateString);
    if (daysEvents.length > 0) {
      dayDiv.classList.add("has-event");
      
      const dot = document.createElement("span");
      dot.className = "event-dot";
      dayDiv.appendChild(dot);

      // Add all pre-school event titles to the tooltip
      tooltipTexts.push(...daysEvents.map(e => e.title));
    }

    // 3. Apply the Tooltip if there is anything to show!
    if (tooltipTexts.length > 0) {
      // Joins multiple events with a clean separator if they land on the same day
      dayDiv.title = tooltipTexts.join(" | "); 
    }

    // 4. NEW. Attach Click Listener for Details
    dayDiv.addEventListener("click", () => {
      const detailsContainer = document.getElementById("day-details-container");
      if (!detailsContainer) return;

      // Highlight the selected day visually (UX touch)
      document.querySelectorAll(".month-day").forEach(d => d.classList.remove("selected-day"));
      dayDiv.classList.add("selected-day");

      // Clear previous details
      detailsContainer.innerHTML = "";

      // If clicking an empty day, maybe show a subtle message or just empty it
      if (daysEvents.length === 0 && !holiday) {
        detailsContainer.innerHTML = `<p class="subtitle" style="text-align: center; padding-top: 15px;">Inga inplanerade händelser.</p>`;
        return;
      }

      let detailsHTML = "";

      // Render Public Holiday (Inspired by the pinkish alert in the screenshot)
      if (holiday) {
        detailsHTML += `
          <div class="alert-card holiday-alert">
            <span class="alert-icon">❗</span>
            <div class="alert-content">
              <strong>Röd dag:</strong><br>
              ${holiday.helgdag}
            </div>
          </div>
        `;
      }

      // Render Pre-school Events (Inspired by the light blue info boxes)
      daysEvents.forEach(event => {
        detailsHTML += `
          <div class="alert-card info-alert">
            <div class="alert-content">
              <strong style="display: block; margin-bottom: 5px; color: var(--text-dark);">❗ ${event.title}</strong>
              <span style="color: var(--text-muted); font-size: 0.95rem;">${event.content}</span>
            </div>
          </div>
        `;
      });

      detailsContainer.innerHTML = detailsHTML;
    });

    grid.appendChild(dayDiv);
  }

  // Restore opacity
  grid.style.opacity = "1";
}

// TEMPLATE FUNCTIONS
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

  const currentChildId = "03974556-db9a-448b-a3a0-a8d4aa1fc498";

  // Run all our data fetches concurrently for maximum speed on page load!
  await Promise.all([
    fetchAndRenderTemplates(),
    generateMonthView(currentYear, currentMonth),
    fetchAndRenderWeeklySchedule(currentChildId)
  ]);
}

initPage();