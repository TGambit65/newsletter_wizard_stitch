import { test, expect } from '@playwright/test';

test.describe('Newsletter Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real tests, you'd authenticate first
    await page.goto('/');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/wizard');
    // Should redirect to login or show auth required
    await expect(page.url()).toMatch(/auth|login/);
  });
});

test.describe('Embed Wizard', () => {
  test('should load embed wizard page', async ({ page }) => {
    await page.goto('/embed/wizard');
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Newsletter/);
  });
});
