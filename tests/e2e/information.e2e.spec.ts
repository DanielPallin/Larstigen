import { test, expect } from '@playwright/test';

test('Användare kan logga in och navigera till matsedeln', async ({ page }) => {
 
  await page.goto('http://localhost:5173/index.html'); 

  // Logga in som vårdnadshavare
  await page.fill('#parent-email', 'test@test.test');
  await page.fill('#parent-password', 'test');
  
  // Klicka på submit i rätt formulär
  await page.click('#parent-login-form button[type="submit"]');

  // Vänta..
  await page.waitForURL('**/dashboard.html');
  await page.waitForLoadState('networkidle');

  // Navigera till rätt sida
  const infoLink = page.locator('a[href="information.html"]');
  await infoLink.click();

  //  Verifiering
  await page.waitForURL('**/information.html');
  
  // Hittar vi det aktiva barnet som är kopplat till inlogget
  const childHeading = page.locator('h3:has-text("Elfie")');
  await expect(childHeading).toBeVisible({ timeout: 10000 });

  // Lokalisera rätt flik där matsedeln finns
  const menuAccordion = page.locator('details.accordion-menu-item');
  
  await menuAccordion.waitFor({ state: 'attached' });
  await menuAccordion.scrollIntoViewIfNeeded();
  await menuAccordion.click();

  // Här lokaliserar vi "Dagens lunch"
  await expect(page.getByText(/Dagens lunch:/i)).toBeVisible();

  // Hitta vecka
  const weekLabel = page.locator('.week-navigation span');
  const initialWeekText = await weekLabel.textContent();

  // Klicka på högerpilen
  await page.click('#next-menu-week');

  // Har veckotexten ändrats?
  await expect(weekLabel).not.toHaveText(initialWeekText || '');
});