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

        renderInformation(myChild, notifications || []);

    } catch (error) {
        console.error("Kunde inte hämta data:", error);
        container.innerHTML = `<p class="error">Ett fel uppstod vid laddning av data.</p>`;
    }
}

async function renderInformation(child: Child, notes: InfoPost[]) {
    const container = document.querySelector('.container');
    if (!container) return;

    const avatarUrl = await getAvatarUrl(child.profile_image_url);

    // 1. Profilkort (Elfie)
    const welcomeHtml = `
        <div class="card">
            <img class="active-pic" src="${avatarUrl}" alt="${child.first_name}">
            <div class="profile-text">
                <h3><strong>${child.first_name}</strong></h3>
                <p>Avdelning: ${child.department?.name || 'Ej angiven'}</p>
            </div>
                    <h1 class="card-title">⚠️ Viktig information</h1>
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
                ${type === 'global' ? '❗' : '🏠'} ${note.title} 
                <span>+</span>
            </summary>
            <div class="content">
                <p>${note.content}</p>
            </div>
        </details>
    `;

    // 4. Bygg ihop de två sektionerna
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

    // 5. Skriv ut allt
    container.innerHTML = welcomeHtml + sectionsHtml;

    // await loadIcons(); // Ladda ikonerna efter att HTML har skapats
}

// Starta allt
async function startApp() {
    await initGlobalUI();
    await getInformationPageData();
}

startApp();