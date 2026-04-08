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
        // (Vill du visa båda barnen kan vi bygga en loop senare)
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

    // Profilkort (Överst)
    const welcomeHtml = `
        <div class="card">
            <img class="active-pic" src="${avatarUrl}" alt="${child.first_name}">
            <div class="profile-text">
                <h3>${child.first_name}</h3>
                <p>Avdelning: ${child.department?.name || 'Ej angiven'}</p>
            </div>
        </div>
    `;

    // Notiser (Dina snygga kort/alerts)
    const notesHtml = notes.map(note => {
        const isGlobal = note.department_id === null;
        
        if (isGlobal) {
            return `
                <div class="alert">
                    <span class="alert-icon" data-icon="alert-circle"></span>
                    <span><strong>${note.title}</strong><br>${note.content}</span>
                </div>
            `;
        } else {
            return `
                <div class="card">
                    <h3 class="card-title">⚠️ ${note.title}</h3>
                    <p>${note.content}</p>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = welcomeHtml + notesHtml;
    await loadIcons(); // Ladda ikonerna efter att HTML har skapats
}

// Starta allt
async function startApp() {
    await initGlobalUI();
    await getInformationPageData();
}

startApp();