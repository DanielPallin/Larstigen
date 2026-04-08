import { supabase } from './api';

async function initProfile() {
  const container = document.getElementById('profile-container');
  if (!container) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/index.html";
      return;
    }

    let userEmail = session.user.email;
    if (userEmail === "test@test.test") userEmail = "daniel.pallin@example.se";

    const { data: loggedInCaregiver, error: cError } = await supabase
      .from('caregiver')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (cError || !loggedInCaregiver) throw new Error("Kunde inte hitta profil");

    const { data: relations, error: rError } = await supabase
      .from('child_caregiver')
      .select(`
        child (
          id, first_name, last_name, 
          department ( name ),
          child_allergy ( severity, note, allergy ( name ) ),
          medical_note ( title, note ),
          child_caregiver (
            caregiver ( id, first_name, last_name, email, phone, address )
          )
        )
      `)
      .eq('caregiver_id', loggedInCaregiver.id);

    if (rError) throw rError;

    const uniqueCaregivers = new Map();
    relations?.forEach((rel: any) => {
      rel.child.child_caregiver?.forEach((cc: any) => {
        if (cc.caregiver) uniqueCaregivers.set(cc.caregiver.id, cc.caregiver);
      });
    });

    if (uniqueCaregivers.size === 0) {
      uniqueCaregivers.set(loggedInCaregiver.id, loggedInCaregiver);
    }

    // --- BYGG HTML ---

    let profileHtml = `<h3 class="section-title">Vårdnadshavare</h3>`;
    
    uniqueCaregivers.forEach((cg) => {
      profileHtml += `
        <div class="card">
          <div class="card-header-flex">
            <h2 class="card-title">${cg.first_name} ${cg.last_name}</h2>
            <button class="btn-edit" onclick="alert('Redigering av vårdnadshavare kommer snart!')">Redigera</button>
          </div>
          <div class="info-grid">
            <p class="label">Kontaktinfo</p>
            <p class="subtitle">${cg.email}</p>
            <p class="subtitle">${cg.phone}</p>
            <p class="label" style="margin-top:10px;">Adress</p>
            <p class="subtitle">${cg.address || 'Ej angiven'}</p>
          </div>
        </div>
      `;
    });

    profileHtml += `<h3 class="section-title">Mina Barn</h3>`;

    // Färgpalett för barnen (Ljusblå, Ljusgul, Ljusgrön, Ljusrosa)
    const childColors = ['#aed5eb', '#ffeaa7', '#9daa75', '#ffcdcd'];
    // Färg för texten i namntaggen så den blir läsbar mot den ljusa bakgrunden
    const textColors = ['#2c6b90', '#9e801c', '#495232', '#9c3838'];

    relations?.forEach((rel: any, index: number) => {
      const c = rel.child;
      // Välj färg baserat på barnets plats i listan
      const color = childColors[index % childColors.length];
      const textColor = textColors[index % textColors.length];

      const allergies = c.child_allergy?.map((a: any) => 
        `<span class="tag tag-danger">${a.allergy.name} (${a.severity})</span>`
      ).join('') || '<p class="subtitle">Inga kända allergier</p>';

      const notes = c.medical_note?.map((n: any) => 
        `<div class="note-box"><strong>${n.title}:</strong> ${n.note}</div>`
      ).join('') || '';

      profileHtml += `
        <div class="card card-child" style="--card-color: ${color};">
          <div class="card-header-flex">
            <span class="name-tag" style="background-color: ${color}40; color: ${textColor};">${c.first_name}</span>
            <button class="btn-edit" onclick="alert('Redigering av barns uppgifter kommer snart!')">Redigera</button>
          </div>
          
          <h2 class="card-title" style="margin-bottom: 4px;">${c.first_name} ${c.last_name}</h2>
          <p class="subtitle" style="margin-bottom: 16px;"><strong>Avdelning:</strong> ${c.department?.name || 'Ej tilldelad'}</p>
          
          <p class="label">Allergier</p>
          <div class="tag-container">${allergies}</div>
          
          ${notes ? `<p class="label">Viktig info</p>${notes}` : ''}
        </div>
      `;
    });

    container.innerHTML = profileHtml;

  } catch (err: any) {
    container.innerHTML = `<div class="card"><p class="subtitle" style="color:red;">Error: ${err.message}</p></div>`;
  }
}

initProfile();