import { supabase } from './api';
import { initGlobalUI, loadIcons } from "./global";

const childColors = ['#aed5eb', '#ffeaa7', '#9daa75', '#ffcdcd'];
let currentFilter: string = 'all'; 
let cachedRelations: any[] = [];
let globalCaregiverId: string = '';

const REACTION_MAP: Record<string, { emoji: string, label: string }> = {
    'LÄST':   { emoji: '👀', label: 'Läst' },
    'HJÄRTA': { emoji: '❤️', label: 'Hjärta' },
    'FINT':   { emoji: '✨', label: 'Fint' },
    'TACK':   { emoji: '🙏', label: 'Tack' }
};

export const escapeHTML = (str: string) => {
    if (!str) return "";
    return str.toString().replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]!));
};

export async function initLogbook(): Promise<void> {
    await initGlobalUI();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/index.html"; return; }

    let userEmail = session.user.email || "";
    if (userEmail === "test@test.test") userEmail = "daniel.pallin@example.se";

    const { data: caregiver } = await supabase
        .from('caregiver')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

    if (!caregiver) return;
    globalCaregiverId = caregiver.id;

    setupReactionListeners(caregiver.id);
    await loadPosts(caregiver.id);

    // Realtime för notiser (Toast)
    supabase.channel('notice-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notice' }, (payload) => {
            showToast(payload.new.title || "Ny uppdatering i loggboken!");
            loadPosts(caregiver.id);
        })
        .subscribe();
}

export async function loadPosts(caregiverId: string) {
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

    if (error) return;
    cachedRelations = relations || [];

    renderFilterBar(cachedRelations);

    let allPosts: any[] = [];
    cachedRelations.forEach((rel, index) => {
        if (currentFilter === 'all' || currentFilter === rel.child.id) {
            const color = childColors[index % childColors.length];
            const posts = (rel.child?.logbook_post || [])
                .filter((p: any) => p.is_published)
                .map((p: any) => ({ ...p, childName: rel.child.first_name, color }));
            allPosts = [...allPosts, ...posts];
        }
    });

    allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const startOfToday = new Date().setHours(0,0,0,0);
    
    const todayPosts = allPosts.filter(p => new Date(p.created_at).getTime() >= startOfToday);
    const olderPosts = allPosts.filter(p => new Date(p.created_at).getTime() < startOfToday);

    if (todayContainer) todayContainer.innerHTML = todayPosts.map(p => renderPostCard(p, caregiverId)).join('') || '<p class="subtitle">Inga inlägg från idag.</p>';
    if (historyContainer) historyContainer.innerHTML = olderPosts.map(p => renderPostCard(p, caregiverId)).join('') || '<p class="subtitle">Ingen historik hittades.</p>';

    setupHistoryToggle();
    await loadIcons();
}

export function renderPostCard(post: any, caregiverId: string) {
    const mediaHtml = (post.logbook_media || [])
        .map((m: any) => {
            if (!m.file_url || m.file_url.includes('<!doctype html>')) return '';
            return m.media_type === 'video' 
                ? `<video src="${m.file_url}" controls class="log-media"></video>`
                : `<img src="${m.file_url}" alt="${escapeHTML(m.alt_text)}" class="log-media">`;
        }).join('');

    const reactionButtons = Object.entries(REACTION_MAP).map(([type, info]) => {
        const count = (post.post_reaction || []).filter((r: any) => r.reaction_type === type).length;
        const hasReacted = (post.post_reaction || []).some((r: any) => r.caregiver_id === caregiverId && r.reaction_type === type);
        return `
            <button class="btn-react ${hasReacted ? 'active' : ''}" 
                    data-post-id="${post.id}" data-type="${type}" ${hasReacted ? 'disabled' : ''}>
                <span class="reaction-emoji">${info.emoji}</span>
                <span class="reaction-label">${info.label}</span>
                <span class="reaction-count">${count}</span>
            </button>`;
    }).join('');

    return `
        <div class="card log-card" style="--child-color: ${post.color};">
            <div class="log-header">
                <span class="child-badge" style="background: ${post.color}">${escapeHTML(post.childName)}</span>
                <span class="subtitle">${new Date(post.created_at).toLocaleDateString('sv-SE')}</span>
            </div>
            <h2 class="card-title">${escapeHTML(post.title || 'Inlägg')}</h2>
            <p class="log-content">${escapeHTML(post.content || '')}</p>
            <div class="media-container">${mediaHtml}</div>
            <div class="reaction-area">${reactionButtons}</div>
        </div>`;
}

export function renderFilterBar(relations: any[]) {
    const container = document.getElementById('child-filter-container');
    if (!container) return;
    let html = `<button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="window.setFilter('all')">Alla barn</button>`;
    relations.forEach((rel, index) => {
        const isActive = currentFilter === rel.child.id;
        const color = childColors[index % childColors.length];
        html += `<button class="filter-btn ${isActive ? 'active' : ''}" 
                 style="${isActive ? `background: ${color}; border-color: ${color};` : ''}"
                 onclick="window.setFilter('${rel.child.id}')">${rel.child.first_name}</button>`;
    });
    container.innerHTML = html;
}

(window as any).setFilter = (childId: string) => {
    currentFilter = childId;
    loadPosts(globalCaregiverId);
};

export function setupReactionListeners(caregiverId: string) {
    const handler = async (e: Event) => {
        const btn = (e.target as HTMLElement).closest('.btn-react') as HTMLButtonElement;
        if (btn && !btn.disabled) {
            const { postId, type } = btn.dataset;
            const { error } = await supabase.from('post_reaction').insert({ logbook_post_id: postId, caregiver_id: caregiverId, reaction_type: type });
            if (!error) loadPosts(caregiverId);
        }
    };
    document.getElementById('today-container')?.addEventListener('click', handler);
    document.getElementById('history-container')?.addEventListener('click', handler);
}

export function setupHistoryToggle() {
    const btn = document.getElementById('btn-show-history');
    const container = document.getElementById('history-container');
    if (btn && container) {
        btn.onclick = () => {
            const isShowing = container.classList.toggle('show');
            btn.innerText = isShowing ? 'Dölj tidigare dagar' : 'Se tidigare dagar';
        };
    }
}

export function showToast(msg: string) {
    const toast = document.getElementById('notification-toast');
    if (toast) { toast.innerText = msg; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 4000); }
}

if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Kör bara tunga saker om vi inte är i en testmiljö (valfritt)
}

// Se till att denna inte körs automatiskt under test:
if (typeof window !== 'undefined' && !window.__VITEST__) {
    initLogbook();
}