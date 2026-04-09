import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'test@test.test';
const VALID_PASSWORD = 'test';

test.describe('E2E: Autentiseringsflöde', () => {

  test.beforeEach(async ({ page }) => {
    // index.html ligger i rooten
    await page.goto('http://localhost:5173/index.html');
  });

  test('ska logga in med korrekta uppgifter och nå dashboard', async ({ page }) => {
    // Fyller i formuläret med ID:n från din index.html
    await page.fill('#parent-email', VALID_EMAIL);
    await page.fill('#parent-password', VALID_PASSWORD);
    
    // Klickar på submit-knappen i rätt formulär
    await page.click('#parent-login-form button[type="submit"]');

    // Vänta på att URL:en ändras till /pages/dashboard.html
    await expect(page).toHaveURL(/.*pages\/dashboard\.html/);

    // Verifiera att rubriken "Överblick" syns på dashboarden
    const header = page.locator('h1');
    await expect(header).toContainText('Överblick');
  });

  test('ska visa att vi stannar på sidan vid felaktigt lösenord', async ({ page }) => {
    await page.fill('#parent-email', VALID_EMAIL);
    await page.fill('#parent-password', 'fel-losenord');
    await page.click('#parent-login-form button[type="submit"]');

    // Vi bör vara kvar på inloggningssidan
    await expect(page).toHaveURL(/.*index\.html/);
  });

  test('skyddad sida (profil) ska kräva inloggning', async ({ page }) => {
    // Försök gå till profil i pages-mappen
    await page.goto('http://localhost:5173/pages/profil.html');

    // Verifiera redirect tillbaka till index i rooten
    await expect(page).toHaveURL(/.*index\.html/);
  });
});