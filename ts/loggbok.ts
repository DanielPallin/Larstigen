import { supabase } from './api';
import { initGlobalUI, loadIcons } from "./global";

const childColors = ['#aed5eb', '#ffeaa7', '#9daa75', '#ffcdcd'];

const REACTION_MAP: Record<string, { emoji: string, label: string }> = {
    'LÄST':   { emoji: '👀', label: 'Läst' },
    'HJÄRTA': { emoji: '❤️', label: 'Hjärta' },
    'FINT':   { emoji: '✨', label: 'Fint' },
    'TACK':   { emoji: '🙏', label: 'Tack' }
};

// Hjälpfunktion för att säkra text (XSS-skydd)
const escapeHTML = (str: string) => {
    if (!str) return "";
    return str.toString().replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]!));
};

async function initLogbook(): Promise<void> {
    await initGlobalUI();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = "/index.html";
        return;
    }

    // Hämta e-post från sessionen
    let userEmail = session.user.email || "";

    // Om du fortfarande behöver Daniel Pallin-fixen för testkontot, 
    // lägg den här (men Gemini Code Assist har rätt i att det är en "dirty fix")
    if (userEmail === "test@test.test") {
        userEmail = "daniel.pallin@example.se"; 
    }

    const { data: caregiver, error: caregiverError } = await supabase
        .from('caregiver')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle(); // Ändrat från .single() för att undvika 406-fel

    if (caregiverError) {
        console.error("Databasfel vid sökning av vårdnadshavare:", caregiverError);
        return;
    }

    if (!caregiver) {
        console.error("Ingen vårdnadshavare hittades i tabellen för:", userEmail);
        // Här kan du visa ett meddelande i UI:t istället för en tom skärm
        const todayContainer = document.getElementById('today-container');
        if (todayContainer) {
            todayContainer.innerHTML = '<p class="subtitle">Ditt konto är inte kopplat till någon profil. Kontakta administratören.</p>';
        }
        return;
    }

    // Om vi har en caregiver, fortsätt som vanligt
    setupReactionListeners(caregiver.id);
    await loadPosts(caregiver.id);

    // ... resten av din realtime-kod ...
}

function setupReactionListeners(caregiverId: string) {
    const reactionHandler = async (e: Event) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('.btn-react') as HTMLButtonElement;
        
        if (btn && !btn.disabled) {
            const postId = btn.dataset.postId;
            const reactionType = btn.dataset.type;
            if (postId && reactionType) {
                const { error } = await supabase
                    .from('post_reaction')
                    .insert({ 
                        logbook_post_id: postId, 
                        caregiver_id: caregiverId, 
                        reaction_type: reactionType 
                    });
                if (!error) loadPosts(caregiverId);
            }
        }
    };

    document.getElementById('today-container')?.addEventListener('click', reactionHandler);
    document.getElementById('history-container')?.addEventListener('click', reactionHandler);
}

async function loadPosts(caregiverId: string) {
    // VIKTIGT: Kontrollera att dessa IDn matchar din index.html exakt!
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
        console.error("Datafel:", error);
        return;
    }

    let allPosts: any[] = [];
    relations?.forEach((rel: any, index: number) => {
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
            // Vi "escapar" inte URL:en då det kan förstöra sökvägen
            return m.media_type === 'video' 
                ? `<video src="${m.file_url}" controls class="log-media"></video>`
                : `<img src="${m.file_url}" alt="${escapeHTML(m.alt_text)}" class="log-media">`;
        })
        .join('');

    const reactionButtons = Object.entries(REACTION_MAP).map(([type, info]) => {
        const reactions = post.post_reaction || [];
        const count = reactions.filter((r: any) => r.reaction_type === type).length;
        const hasReacted = reactions.some((r: any) => r.caregiver_id === caregiverId && r.reaction_type === type);

        return `
            <button class="btn-react ${hasReacted ? 'active' : ''}" 
                    data-post-id="${post.id}" 
                    data-type="${type}"
                    ${hasReacted ? 'disabled' : ''}>
                <span class="reaction-emoji">${info.emoji}</span>
                <span class="reaction-label">${info.label}</span>
                <span class="reaction-count">${count}</span>
            </button>
        `;
    }).join('');

    return `
        <div class="card log-card" style="--child-color: ${post.color}; background: white; margin-bottom: 20px; padding: 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div class="log-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="child-badge" style="background: ${post.color}; padding: 4px 10px; border-radius: 15px; font-weight: bold; font-size: 0.8rem;">
                    ${escapeHTML(post.childName)}
                </span>
                <span class="subtitle" style="color: #666; font-size: 0.85rem;">
                    ${new Date(post.created_at).toLocaleDateString('sv-SE')}
                </span>
            </div>
            <h2 class="card-title" style="color: var(--primary-green, #2d5a27); margin-bottom: 8px; font-size: 1.2rem;">
                ${escapeHTML(post.title || 'Inlägg')}
            </h2>
            <p class="log-content" style="margin-bottom: 15px; line-height: 1.5; white-space: pre-wrap;">
                ${escapeHTML(post.content || '')}
            </p>
            <div class="media-container" style="display: flex; flex-direction: column; gap: 10px;">
                ${mediaHtml}
            </div>
            <div class="reaction-area" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                ${reactionButtons}
            </div>
        </div>
    `;
}

// ... Resten av funktionerna (setupHistoryToggle, showToast) förblir desamma ...
function setupHistoryToggle() {
    const historyBtn = document.getElementById('btn-show-history');
    const historyContainer = document.getElementById('history-container');
    if (historyBtn && historyContainer) {
        historyBtn.onclick = () => {
            const isShowing = historyContainer.classList.toggle('show');
            historyBtn.innerText = isShowing ? 'Dölj tidigare dagar' : 'Se tidigare dagar';
        };
    }
}

function showToast(message: string) {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        toast.innerText = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }
}

initLogbook();