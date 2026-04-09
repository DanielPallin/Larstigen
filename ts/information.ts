import { supabase } from './api';
import { initGlobalUI, loadIcons } from './global.js';

// --- INTERFACES ---
interface Child {
    id: string;
    first_name: string;
    profile_image_url: string | null;
    department_id: string;
    department?: { name: string };
}

interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  img_url: string | null;
}

interface RelationData {
  child: Child | null;
}

interface InfoPost {
    id: string;
    title: string;
    content: string;
    department_id: string | null;
    created_at: string;
}

interface MenuPost {
    id: string;
    date: string;
    title: string;
    description: string;
    department_id: string | null;
}

// Globalt state för att hålla koll på vilken vecka användaren tittar på
let menuCurrentDate = new Date(); // Startar med dagens datum

// --- HJÄLPFUNKTION FÖR BILDER (Samma som gruppmedlemmen) ---
async function getAvatarUrl(fileName: string | null): Promise<string> {
    if (!fileName) return '/assets/avatars/default.jpg';
    
    const { data } = await supabase.storage.from('avatars').getPublicUrl(fileName);
    return data?.publicUrl || '/assets/avatars/default.jpg';
}

async function getInformationPageData() {
    const container = document.querySelector('.container');
    
    if (!container) return;

    try {
        // 1. Kontrollera session (Inloggning)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = "/index.html";
            return;
        }

        // --- TEST-FIX START ---
        let userEmail = session.user.email || "";
        // Om du är inloggad som test@test.test, låtsas vi att du är Daniel för att hitta barnet
        if (userEmail === "test@test.test") {
            userEmail = "daniel.pallin@example.se";
        }
        // --- TEST-FIX SLUT ---

        // 2. Hämta caregiver baserat på email för att få rätt ID
        const { data: caregiver, error: cgError } = await supabase
            .from('caregiver')
            .select('id')
            .eq('email', userEmail)
            .single();

        if (cgError || !caregiver) {
            throw new Error("Hittade ingen caregiver i databasen.");
        }

        // 3. Hämta barnet via relationstabellen
        const { data: relations, error: relError } = await supabase
            .from('child_caregiver')
            .select(`
                child (
                    id, first_name, profile_image_url, department_id,
                    department ( name )
                )
            `)
            .eq('caregiver_id', caregiver.id)
          

            // Kolla om vi fick några träffar i listan
        if (relError || !relations || relations.length === 0) {
            container.innerHTML = `<div class="card"><p>Hittade inget barn kopplat till din profil.</p></div>`;
            return;
        }

        // Eftersom Daniel har flera barn, väljer vi det första i listan för att visa informationen
        const firstRelation = relations[0] as any;
        const myChild = firstRelation.child as unknown as Child;
        const menuData = await fetchMenuData(myChild.department_id);

        // 4. Hämta notiser/info baserat på barnets avdelning
        const { data: notifications, error: infoError } = await supabase
            .from('info')
            .select('*')
            .or(`department_id.eq.${myChild.department_id},department_id.is.null`)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (!myChild) {
            container.innerHTML = `<div class="card"><p>Kunde inte läsa barnets data.</p></div>`;
            return;
        }

        if (infoError) throw infoError;

        await renderInformation(myChild, notifications || []);

        renderMenuSection(menuData, myChild.department_id);

    } catch (error) {
        console.error("Kunde inte hämta data:", error);
        container.innerHTML = `<p class="error">Ett fel uppstod vid laddning av data.</p>`;
    }

    

// Skapa en container för menyn i din HTML-sträng eller i DOM

}

async function renderInformation(child: Child, notes: InfoPost[]) {
    const container = document.querySelector('.container');
    if (!container) return;

  
    const avatarUrl = await getAvatarUrl(child.profile_image_url);

    // 1. Profilkort (Elfie)
    const welcomeHtml = `
        <div class="card">
        <h1 class="info-title">⚠️ Viktig information</h1>
          <img class="active-pic" 
            src="${avatarUrl}" 
            alt="${child.first_name}" 
            crossorigin="anonymous">
          <div class="profile-text">
              <h3><strong>${child.first_name}</strong></h3>
               <p>Avdelning: ${child.department?.name || 'Ej angiven'}</p>
          </div>
                    
        </div>
    `;

    // Delar upp notiserna i två grupper
    const globalNotes = notes.filter(n => n.department_id === null);
    const departmentNotes = notes.filter(n => n.department_id !== null);

    // Hjälpfunktion för att skapa HTML för en notis
    // Lägger till en parameter 'type' för att kunna sätta olika CSS-klasser
const createNoteHtml = (note: InfoPost, type: 'global' | 'dept') => `
    <details class="accordion-item note-${type}">
        <summary>
            <div class="summary-content">
                ${type === 'global' ? '<img class="alert-circle" src="/icons/alert-circle.svg">' : '<img class="home" src="/icons/home.svg">'} 
                <span>${note.title}</span>
            </div>
            <span class="plus">+</span>
        </summary>
        <div class="content">
            <p>${note.content}</p>
        </div>
    </details>
    `;

    // Bygg ihop de två sektionerna
    let sectionsHtml = '';

    // Sektion för hela förskolan (Globala)
    if (globalNotes.length > 0) {
        sectionsHtml += `
            <div class="card card-global">
                <h3 class="card-title">📢 HELA FÖRSKOLAN</h3>
                ${globalNotes.map(n => createNoteHtml(n, 'global')).join('')}
            </div>
        `;
    }

    // Sektion för avdelningen
    if (departmentNotes.length > 0) {
        sectionsHtml += `
            <div class="card card-department">
                <h3 class="card-title">🌳 AVDELNING ${child.department?.name?.toUpperCase() || 'INFO'}</h3>
                ${departmentNotes.map(n => createNoteHtml(n, 'dept')).join('')}
            </div>
        `;
    }
    const menuPlaceholder = `<div id="menu-accordion-container" class="card"></div>`;
    
    // Skriver ut allt
    container.innerHTML = welcomeHtml + sectionsHtml + menuPlaceholder;

    // await loadIcons(); // Ladda ikonerna efter att HTML har skapats
}

function getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Justera för söndagar
    return new Date(date.setDate(diff));
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

async function fetchMenuData(departmentId: string | null): Promise<MenuPost[]> {
    // Vi hämtar ett brett spann för att vara säkra, eller filtrerar direkt i Supabase
    // Här använder vi din JSON-struktur som bas
    const { data, error } = await supabase
        .from('menu')
        .select('*')
        .or(`department_id.eq.${departmentId},department_id.is.null`)
        .order('date', { ascending: true });

    return data || [];
}

export async function renderMenuSection(allMenus: MenuPost[], childDeptId: string | null) {
    const menuContainer = document.getElementById('menu-accordion-container');
    if (!menuContainer) return;

    const isCurrentlyOpen = menuContainer.querySelector('details')?.hasAttribute('open');

    const monday = getMonday(menuCurrentDate);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    // Hitta dagens mat
    const todayStr = formatDate(new Date());
    const todayMenu = allMenus.find(m => m.date === todayStr);
    const todayTitle = todayMenu ? todayMenu.title : "Ingen meny sparad";

    // Filtrera veckans mat (Mån-Fre)
    const weekDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
    let weekHtml = '<ul>';
    
    for (let i = 0; i < 5; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        const dateStr = formatDate(currentDay);
        const dayMenu = allMenus.find(m => m.date === dateStr);
        
        weekHtml += `
            <li>
                <strong>${weekDays[i]}:</strong> 
                ${dayMenu ? dayMenu.title : '<span class="text-muted">Information saknas</span>'}
                ${dayMenu ? `<br><small>${dayMenu.description}</small>` : ''}
            </li>`;
    }
    weekHtml += '</ul>';

    menuContainer.innerHTML = `
       <h3 class="card-title">🍴 MATSEDEL</h3>
        <details class="accordion-item menu-main-item" ${isCurrentlyOpen ? 'open' : ''}>
            <summary>
                <div class="summary-content">
                    <span><strong>Dagens lunch:</strong> ${todayTitle}</span>
                    
                </div><span class="menu-week-label">Se hela veckan</span><span class=plus>+</span>
            </summary>
            <div class="content">
                <div class="week-navigation">
                    <button id="prev-menu-week" class="btn-small">◀</button>
                    <span><strong>Vecka ${getWeekNumber(monday)}</strong></span>
                    <button id="next-menu-week" class="btn-small">▶</button>
                </div>
                ${weekHtml}
            </div>
        </details>
    `;

    // Event listeners för att byta vecka
    document.getElementById('prev-menu-week')?.addEventListener('click', (e) => {
        e.preventDefault();
        menuCurrentDate.setDate(menuCurrentDate.getDate() - 7);
        renderMenuSection(allMenus, childDeptId);
    });

    document.getElementById('next-menu-week')?.addEventListener('click', (e) => {
        e.preventDefault();
        menuCurrentDate.setDate(menuCurrentDate.getDate() + 7);
        renderMenuSection(allMenus, childDeptId);
    });
}

// Hjälpfunktion för veckonummer
export function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Starta allt
async function startApp() {
    await initGlobalUI();
    await getInformationPageData();
  
}

startApp();