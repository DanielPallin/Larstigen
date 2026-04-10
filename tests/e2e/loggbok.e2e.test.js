import { test, expect } from '@playwright/test';

test.describe('Loggbok E2E Flow', () => {
  
  test('Vårdnadshavare ska kunna logga in och se loggboken', async ({ page }) => {
    // 1. Logga in (Auth Guard omdirigerar oss från / till /index.html om vi är utloggade)
    await page.goto('http://localhost:5173/index.html');
    
    await page.fill('input[type="email"]', 'test@test.test');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');

    // 2. Vänta på att Auth Guard släpper igenom oss till Dashboard
    await expect(page).toHaveURL(/dashboard/);

    // 3. Gå till Loggboken
    await page.goto('http://localhost:5173/pages/loggbok.html');
    
    // 4. Verifiera att data har laddats (inlägg från Supabase)
    const logCard = page.locator('.log-card').first();
    await expect(logCard).toBeVisible({ timeout: 10000 });

    // 5. Interagera med en reaktion
    const reactionBtn = page.locator('.btn-react').first();
    
    // Om knappen inte redan är tryckt, klicka på den
    const isAlreadyActive = await reactionBtn.evaluate(el => el.classList.contains('active'));
    
    if (!isAlreadyActive) {
      await reactionBtn.click();
      await expect(reactionBtn).toHaveClass(/active/);
    } else {
      console.log('Inlägget hade redan en reaktion, verifierar bara att den syns.');
      await expect(reactionBtn).toBeVisible();
    }
  });
});