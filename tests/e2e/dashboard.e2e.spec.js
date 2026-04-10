import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pages/dashboard.html");
  });

  test("sidan laddar med viktiga delar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Överblick" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Välj barn" })).toBeVisible();
    await expect(page.locator("#child-filter")).toBeVisible();
    await expect(page.locator("#important-updates")).toBeVisible();
  });

  test("det går att skriva hämtare och spara", async ({ page }) => {
    await page.locator("#pickup-name").fill("Morfar");
    await page.getByRole("button", { name: "Spara" }).click();
    await expect(page.locator("#pickup-results")).toContainText("Morfar");
  });
});