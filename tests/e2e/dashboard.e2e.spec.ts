import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard kräver inloggning utan session", async ({ page }) => {
    await page.goto("http://localhost:5173/pages/dashboard.html", {
      waitUntil: "domcontentloaded",
    });

    await expect
      .poll(() => new URL(page.url()).pathname, {
        timeout: 10000,
      })
      .toBe("/index.html");
  });
});