import { expect, test } from "@playwright/test";

test("dashboard kräver inloggning utan session", async ({ page }) => {
  await page.goto("http://localhost:5173/pages/dashboard.html");

  await page.waitForURL(/index\.html$/);

  await expect(page).toHaveURL(/index\.html$/);
});