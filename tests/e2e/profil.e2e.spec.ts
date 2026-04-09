import { test, expect } from '@playwright/test';

test.describe('E2E Test: Säkerhet och Profilsida', () => {

  test('Obehörig användare ska kastas ut från profilsidan', async ({ page }) => {
    // 1. Vi försöker smyga direkt in på den SKYDDADE profilsidan utan att logga in.
    // (Ändra till 'http://localhost:5173/profil.html' om filen ligger direkt i rooten)
    await page.goto('http://localhost:5173/pages/profil.html');

    // 2. Vi väntar lite så att din Auth Guard (requireAuth) hinner köra sitt API-anrop och kasta ut oss
    await page.waitForTimeout(1000); 

    // 3. Vi kollar att webbläsaren har tvingats byta URL tillbaka till inloggningen.
    // Denna RegExp godkänner nu både om URL:en blir /index.html eller bara sneda strecket /
    await expect(page).toHaveURL(/.*index\.html|http:\/\/localhost:5173\/?$/);
  });

  test('Startsidan (inloggningen) laddas korrekt', async ({ page }) => {
    // 1. Gå till startsidan (Vi lägger till hela adressen här med)
    await page.goto('http://localhost:5173/index.html');

    // 2. Kolla att titeln på fliken stämmer
    await expect(page).toHaveTitle(/Lärstigen/i);
  });

});