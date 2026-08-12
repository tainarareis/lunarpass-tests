import { test, expect } from '@playwright/test';

test('must display the page slogan', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Lunar Pass — Passagens para a Lua")
});
