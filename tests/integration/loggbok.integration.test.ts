import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupHistoryToggle } from '../../ts/loggbok';

// Eftersom loggbok.ts kör initLogbook() automatiskt vid import, 
// mockar vi supabase så att det inte kraschar testet.
vi.mock('../../ts/api', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })
  }
}));

describe('Loggbok Integration Test', () => {
  
  beforeEach(() => {
    // Sätt upp samma HTML-struktur som finns i loggbok.html
    document.body.innerHTML = `
      <button id="btn-show-history">Se tidigare dagar</button>
      <div id="history-container" class="history-hidden"></div>
    `;
  });

  it('ska toggla klassen "show" och ändra knapptexten när man klickar på historik-knappen', () => {
    setupHistoryToggle(); // Starta logiken

    const btn = document.getElementById('btn-show-history');
    const container = document.getElementById('history-container');

    // 1. Klicka en gång (visa)
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container?.classList.contains('show')).toBe(true);
    expect(btn?.innerText).toBe('Dölj tidigare dagar');

    // 2. Klicka igen (dölj)
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(container?.classList.contains('show')).toBe(false);
    expect(btn?.innerText).toBe('Se tidigare dagar');
  });
});