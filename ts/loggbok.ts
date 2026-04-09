import { supabase } from './api';
import { initGlobalUI, loadIcons } from "./global";

// --- KONFIGURATION ---
const childColors = ['#aed5eb', '#ffeaa7', '#9daa75', '#ffcdcd'];

const REACTION_MAP: Record<string, { emoji: string, label: string }> = {
    'LÄST':   { emoji: '👀', label: 'Läst' },
    'HJÄRTA': { emoji: '❤️', label: 'Hjärta' },
    'FINT':   { emoji: '✨', label: 'Fint' },
    'TACK':   { emoji: '🙏', label: 'Tack' }
};

// --- INITIALISERING ---
async function initLogbook(): Promise<void> {
    await initGlobalUI();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = "/index.html";
        return;
    }

    // TEST-FIX för Daniel Pallin
    let userEmail = session.user.email || "";
    if (userEmail === "test@test.test") userEmail = "daniel.pallin@example.se";

    const { data: caregiver, error: caregiverError } = await supabase
        .from('caregiver')
        .select('id')
        .eq('email', userEmail)
        .single();

    if (caregiverError || !caregiver) {
        console.error("Kunde inte hitta vårdnadshavare:", caregiverError);
        return;
    }

    // Ladda inlägg
    await loadPosts(caregiver.id);

    // Realtime-lyssnare
    supabase.channel('logbook-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logbook_post' }, () => {
        loadPosts(caregiver.id);
    }).subscribe();

    // Inuti initLogbook i logbook.ts
supabase.channel('notice-updates')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notice' },
    async (payload) => {
      console.log('Ny notis mottagen:', payload);
      
      // Hämta titeln från den nya notisen (payload.new innehåller den nya raden)
      const noticeTitle = payload.new.title || "Ny information";
      
      // Visa toasten med titeln
      showToast(noticeTitle);
      
      // Ladda om inläggen (eftersom en ny notis kan betyda ett nytt loggboksinlägg)
      if (caregiver.id) {
          loadPosts(caregiver.id);
      }
    }
  )
  .subscribe();
}

// --- FUNKTIONER ---

function setupHistoryToggle() {
    const historyBtn = document.getElementById('btn-show-history');
    const historyContainer = document.getElementById('history-container');

    if (historyBtn && historyContainer) {
        historyBtn.replaceWith(historyBtn.cloneNode(true));
        const newBtn = document.getElementById('btn-show-history') as HTMLButtonElement;
        
        newBtn.addEventListener('click', () => {
            const isShowing = historyContainer.classList.toggle('show');
            newBtn.innerText = isShowing ? 'Dölj tidigare dagar' : 'Se tidigare dagar';
            if (isShowing) {
                historyContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

async function loadPosts(caregiverId: string) {
    const todayContainer = document.getElementById('today-container');
    const historyContainer = document.getElementById('history-container');

    const { data: relations, error } = await supabase
        .from('child_caregiver')
        .select(`
            child (
                id, first_name,
                logbook_post (
                    id, title, content, created_at, is_published,
                    logbook_media ( file_url, media_type, alt_text ),
                    post_reaction ( caregiver_id, reaction_type )
                )
            )
        `)
        .eq('caregiver_id', caregiverId);

    if (error) {
        console.error("Datahämtning misslyckades:", error.message);
        return;
    }

    let allPosts: any[] = [];
    if (relations) {
        relations.forEach((rel: any, index: number) => {
            const color = childColors[index % childColors.length];
            const childPosts = rel.child?.logbook_post || [];
            childPosts.forEach((post: any) => {
                if (post.is_published) {
                    allPosts.push({
                        ...post,
                        childName: rel.child.first_name,
                        color: color
                    });
                }
            });
        });
    }

    allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const startOfToday = new Date().setHours(0,0,0,0);
    const todayPosts = allPosts.filter(p => new Date(p.created_at).getTime() >= startOfToday);
    const olderPosts = allPosts.filter(p => new Date(p.created_at).getTime() < startOfToday);

    if (todayContainer) {
        todayContainer.innerHTML = todayPosts.length 
            ? todayPosts.map(p => renderPostCard(p, caregiverId)).join('')
            : '<p class="subtitle">Inga inlägg från idag.</p>';
    }

    if (historyContainer) {
        historyContainer.innerHTML = olderPosts.length
            ? olderPosts.map(p => renderPostCard(p, caregiverId)).join('')
            : '<p class="subtitle">Ingen historik hittades.</p>';
    }

    setupHistoryToggle();
    await loadIcons();
}

function renderPostCard(post: any, caregiverId: string) {
    const mediaHtml = (post.logbook_media || [])
        .map((m: any) => {
            if (!m.file_url || m.file_url.includes('<!doctype html>')) return '';
            return m.media_type === 'video' 
                ? `<video src="${m.file_url}" controls class="log-media"></video>`
                : `<img src="${m.file_url}" alt="${m.alt_text || ''}" class="log-media">`;
        })
        .join('');

    const reactionButtons = Object.entries(REACTION_MAP).map(([type, info]) => {
        const count = (post.post_reaction || []).filter((r: any) => r.reaction_type === type).length;
        const hasReacted = (post.post_reaction || []).some(
            (r: any) => r.caregiver_id === caregiverId && r.reaction_type === type
        );

        return `
            <button class="btn-react ${hasReacted ? 'active' : ''}" 
                    onclick="window.handleReaction('${post.id}', '${caregiverId}', '${type}')"
                    ${hasReacted ? 'disabled' : ''}>
                <span class="reaction-emoji">${info.emoji}</span>
                <span class="reaction-label">${info.label}</span>
                <span class="reaction-count">${count}</span>
            </button>
        `;
    }).join('');

    return `
        <div class="card log-card" style="--child-color: ${post.color}; background: white; margin-bottom: 20px;">
            <div class="log-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="child-badge" style="background: ${post.color}; padding: 4px 10px; border-radius: 15px; font-weight: bold; font-size: 0.8rem;">
                    ${post.childName}
                </span>
                <span class="subtitle" style="color: #666; font-size: 0.85rem;">
                    ${new Date(post.created_at).toLocaleDateString('sv-SE')}
                </span>
            </div>
            <h2 class="card-title" style="color: var(--primary-green); margin-bottom: 8px;">${post.title || 'Inlägg'}</h2>
            <p class="log-content" style="margin-bottom: 15px; line-height: 1.5;">${post.content || ''}</p>
            <div class="media-container">${mediaHtml}</div>
            <div class="reaction-area" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                ${reactionButtons}
            </div>
        </div>
    `;
}

function showToast(message: string) {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        // Uppdatera texten i toasten
        toast.innerText = message;
        
        toast.classList.remove('hidden');
        
        // Dölj den efter 4 sekunder
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
}


// --- GLOBALA WINDOW-FUNKTIONER ---
(window as any).handleReaction = async (postId: string, caregiverId: string, type: string) => {
    const { error } = await supabase
        .from('post_reaction')
        .insert({ 
            logbook_post_id: postId, 
            caregiver_id: caregiverId, 
            reaction_type: type 
        });

    if (!error) {
        loadPosts(caregiverId);
    } else {
        console.error("Kunde inte spara reaktion:", error.message);
    }
};

// Starta appen
initLogbook();