import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupViewToggles } from '../../ts/kalender';

// We mock fetchAndRenderWeeklySchedule so it doesn't try to fetch from Supabase
// when the 'Schema' tab is clicked during our UI test.
vi.mock('../../ts/kalender', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    fetchAndRenderWeeklySchedule: vi.fn() 
  };
});

describe('Integration test: Kalender Fliknavigering (View Toggles)', () => {
  
  beforeEach(() => {
    // 1. Minimal DOM setup based on your HTML structure
    document.body.innerHTML = `
      <div class="view-controls full-width">
        <button class="view-btn" id="btn-create" data-target="view-create">Skapa Schema</button>
        <button class="view-btn active" id="btn-schema" data-target="view-schema">Schema</button>
        <button class="view-btn" id="btn-overview" data-target="view-overview">Översikt</button>
      </div>

      <div id="view-create" class="view-section" style="display: none;"></div>
      <div id="view-schema" class="view-section" style="display: block;"></div>
      <div id="view-overview" class="view-section" style="display: none;"></div>
    `;

    // 2. Attach the event listeners to the mock DOM
    setupViewToggles();
  });

  it('ska navigera från "Schema" till "Översikt" med korrekta CSS-klasser', () => {
    const btnSchema = document.getElementById('btn-schema') as HTMLButtonElement;
    const btnOverview = document.getElementById('btn-overview') as HTMLButtonElement;
    const sectionSchema = document.getElementById('view-schema');
    const sectionOverview = document.getElementById('view-overview');

    // Verifiera utgångsläget: 
    // "SCHEMA" ska ha `active` class
    // Schema taben ska vara block och synlig
    // Översikt ska inte vara synlig
    expect(btnSchema.classList.contains('active')).toBe(true);
    expect(sectionSchema?.style.display).toBe('block');
    expect(sectionOverview?.style.display).toBe('none');

    // Använd dispatchEvent för säkra JSDOM-klick
    btnOverview.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Verifiera att knapparna bytt utseende. 
    // Översikt ska nu ha vår `active` class, Schema ska ha förlorat den
    expect(btnOverview.classList.contains('active')).toBe(true);
    expect(btnSchema.classList.contains('active')).toBe(false);

    // Verifiera att rätt div visas/döljs
    expect(sectionOverview?.style.display).toBe('block');
    expect(sectionSchema?.style.display).toBe('none');
  });

});