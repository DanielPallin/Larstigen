import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. MOCKA API (Supabase)
// Vi backar ur 'integration', backar ur 'tests', går in i 'ts' och hittar 'api.ts'
vi.mock('../../ts/api', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { email: 'test@test.se' } } },
        error: null
      })
    },
    // Här bygger vi en fejk-version av Supabase "from().select().eq()" kedja
    from: vi.fn((table) => {
      if (table === 'caregiver') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'c1', 
              first_name: 'Hanna', 
              last_name: 'Testsson', 
              email: 'hanna@test.se', 
              phone: '0701234567', 
              address: 'Testgatan 1', 
              img_url: null 
            },
            error: null
          })
        };
      }
      if (table === 'child_caregiver') {
         return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                child: {
                  id: 'b1', 
                  first_name: 'Nils', 
                  last_name: 'Testsson', 
                  profile_image_url: null,
                  department: { name: 'Kottarna' },
                  child_allergy: [{ severity: 'Hög', allergy: { name: 'Jordnötter' } }],
                  medical_note: [{ title: 'Allmänt', note: 'Älskar att bygga lego' }],
                  child_caregiver: []
                }
              }
            ],
            error: null
          })
         };
      }
    }),
    storage: {
      from: vi.fn().mockReturnThis(),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'fake-url' }, error: null })
    }
  }
}));

// 2. MOCKA GLOBAL
// Vi backar ur 'integration', backar ur 'tests', går in i 'ts' och hittar 'global.ts'
vi.mock('../../ts/global', () => ({
  initGlobalUI: vi.fn()
}));

describe('Integrationstest: Profilsidan', () => {
  beforeEach(() => {
    // 3. SKAPA EN LÅTSAS-DOM INFÖR VARJE TEST
    // Vi lägger in containern exakt så som den ser ut i din profil.html
    document.body.innerHTML = `
      <main class="container" id="profile-container">
        <div class="card"><p class="subtitle">Hämtar din profilinformation...</p></div>
      </main>
    `;
  });

  it('ska hämta data och bygga HTML för vårdnadshavare och barn', async () => {
    // 4. TRIGGA KODEN
    // Startar profil.ts filen med den korrekta sökvägen
    await import('../../ts/profil');

    // Låt funktionen arbeta klart i bakgrunden en kort sekund
    await new Promise(resolve => setTimeout(resolve, 50));

    // 5. HÄMTA DET FÄRDIGA RESULTATET
    const container = document.getElementById('profile-container');
    const html = container?.innerHTML || '';

    // 6. TESTA ATT RÄTT SAKER FINNS PÅ SKÄRMEN
    // Testar Vårdnadshavaren
    expect(html).toContain('Hanna Testsson');
    expect(html).toContain('hanna@test.se');
    expect(html).toContain('Testgatan 1');

    // Testar Barnet
    expect(html).toContain('Nils');
    expect(html).toContain('Kottarna'); // Avdelning
    
    // Testar Allergier och Noteringar
    expect(html).toContain('Jordnötter (Hög)');
    expect(html).toContain('Älskar att bygga lego');
    
    // Testar att knappen "Redigera" skapades
    expect(html).toContain('Redigera');
  });
});