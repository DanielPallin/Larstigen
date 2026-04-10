import { supabase } from './api';
import { initGlobalUI } from "./global";
import "/css/global.css";
import "/css/components.css";
import "/css/dashboard.css";
export function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
}
// --- 2. HJÄLPFUNKTION FÖR BILDER ---
async function getAvatarUrl(fileName) {
    if (!fileName)
        return null;
    const { data, error } = await supabase
        .storage
        .from('avatars')
        .createSignedUrl(fileName, 3600);
    if (error) {
        console.error(`Kunde inte hämta bild ${fileName}:`, error.message);
        return null;
    }
    return data?.signedUrl || null;
}
// --- 3. HUVUDFUNKTION ---
async function initProfile() {
    await initGlobalUI();
    const container = document.getElementById('profile-container');
    if (!container)
        return;
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            window.location.href = "/index.html";
            return;
        }
        let userEmail = session.user.email || "";
        if (userEmail === "test@test.test")
            userEmail = "daniel.pallin@example.se";
        const { data: rawCaregiver, error: cError } = await supabase
            .from('caregiver')
            .select('*')
            .eq('email', userEmail)
            .single();
        if (cError || !rawCaregiver)
            throw new Error("Kunde inte hitta profil i databasen.");
        const loggedInCaregiver = rawCaregiver;
        const { data: rawRelations, error: rError } = await supabase
            .from('child_caregiver')
            .select(`
        child (
          id, first_name, last_name, profile_image_url,
          department ( name ),
          child_allergy ( severity, allergy ( name ) ),
          medical_note ( title, note ),
          child_caregiver (
            caregiver ( id, first_name, last_name, email, phone, address, img_url )
          )
        )
      `)
            .eq('caregiver_id', loggedInCaregiver.id);
        if (rError)
            throw rError;
        const relations = (rawRelations || []);
        const uniqueCaregivers = new Map();
        relations.forEach((rel) => {
            const childCaregivers = rel.child?.child_caregiver || [];
            childCaregivers.forEach((cc) => {
                if (cc.caregiver && cc.caregiver.id) {
                    uniqueCaregivers.set(cc.caregiver.id, cc.caregiver);
                }
            });
        });
        if (uniqueCaregivers.size === 0) {
            uniqueCaregivers.set(loggedInCaregiver.id, loggedInCaregiver);
        }
        // ================= BYGG HTML ================= //
        let profileHtml = `<h3 class="section-title">Vårdnadshavare</h3>`;
        // Sektion 1: Vårdnadshavare
        for (const cg of Array.from(uniqueCaregivers.values())) {
            const avatarUrl = await getAvatarUrl(cg.img_url);
            const firstInitial = cg.first_name ? cg.first_name[0] : '';
            const lastInitial = cg.last_name ? cg.last_name[0] : '';
            const avatarHtml = avatarUrl
                ? `<div class="avatar"><img src="${avatarUrl}" alt="${cg.first_name}"></div>`
                : `<div class="avatar">${firstInitial}${lastInitial}</div>`;
            profileHtml += `
        <div class="card">
          <div class="card-header-flex">
            <div style="display: flex; align-items: center; gap: 15px;">
              ${avatarHtml}
              <h2 class="card-title" style="margin: 0;">${cg.first_name || ''} ${cg.last_name || ''}</h2>
            </div>
            <button class="btn-edit" onclick="alert('Redigering kommer snart!')">Redigera</button>
          </div>
          <div class="info-grid" style="margin-top: 15px;">
            <p class="label">Kontaktinfo</p>
            <p class="subtitle">${cg.email || 'Ej angiven'}</p>
            <p class="subtitle">${cg.phone || 'Ej angiven'}</p>
            <p class="label" style="margin-top:10px;">Adress</p>
            <p class="subtitle">${cg.address || 'Ej angiven'}</p>
          </div>
        </div>
      `;
        }
        profileHtml += `<h3 class="section-title">Mina Barn</h3>`;
        const childColors = ['#aed5eb', '#ffeaa7', '#9daa75', '#ffcdcd'];
        // Sektion 2: Barn
        for (let i = 0; i < relations.length; i++) {
            const c = relations[i].child;
            if (!c)
                continue;
            const color = childColors[i % childColors.length];
            const avatarUrl = await getAvatarUrl(c.profile_image_url);
            let allergiesHtml = '<p class="subtitle">Inga kända allergier</p>';
            if (c.child_allergy && c.child_allergy.length > 0) {
                allergiesHtml = c.child_allergy.map(a => {
                    const allergyName = a.allergy?.name || 'Okänd';
                    const severity = a.severity || 'Okänd grad';
                    return `<span class="tag tag-danger">${allergyName} (${severity})</span>`;
                }).join('');
            }
            let notesHtml = '';
            if (c.medical_note && c.medical_note.length > 0) {
                notesHtml = c.medical_note.map(n => `<div class="note-box"><strong>${n.title || 'Info'}:</strong> ${n.note || ''}</div>`).join('');
            }
            // ENHETLIG AVATAR FÖR BARN (Rund och snygg, samma som föräldrar)
            const firstInitial = c.first_name ? c.first_name[0] : '';
            const avatarHtml = avatarUrl
                ? `<div class="avatar"><img src="${avatarUrl}" alt="${c.first_name}"></div>`
                : `<div class="avatar">${firstInitial}</div>`;
            profileHtml += `
        <div class="card card-child" style="--card-color: ${color};">
          <div class="card-header-flex">
            <div style="display: flex; align-items: center; gap: 15px;">
              ${avatarHtml}
              <div>
                <h2 class="card-title" style="margin: 0; font-size: 1.4rem;">${c.first_name || ''}</h2>
              </div>
            </div>
            <button class="btn-edit" onclick="alert('Redigering kommer snart!')">Redigera</button>
          </div>
          
          <p class="subtitle" style="margin-top: 15px; margin-bottom: 16px;"><strong>Avdelning:</strong> ${c.department?.name || 'Ej tilldelad'}</p>
          
          <p class="label">Allergier</p>
          <div class="tag-container">${allergiesHtml}</div>
          
          ${notesHtml ? `<p class="label">Viktig info</p>${notesHtml}` : ''}
        </div>
      `;
        }
        container.innerHTML = profileHtml;
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Ett oväntat fel uppstod';
        container.innerHTML = `<div class="card"><p class="subtitle" style="color:red;">Error: ${errorMsg}</p></div>`;
    }
}
initProfile();
