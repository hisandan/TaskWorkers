import { expect, test } from "@playwright/test";

test("ESC-33 la aplicación carga", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBeTruthy();
});
