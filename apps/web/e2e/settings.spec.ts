import { test, expect } from '@playwright/test';

test.describe('Settings Pages', () => {
  test('should redirect unauthenticated users from settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.url()).toMatch(/auth|login/);
  });

  test('should redirect unauthenticated users from API keys', async ({ page }) => {
    await page.goto('/api-keys');
    await expect(page.url()).toMatch(/auth|login/);
  });

  test('should redirect unauthenticated users from webhooks', async ({ page }) => {
    await page.goto('/webhooks');
    await expect(page.url()).toMatch(/auth|login/);
  });
});
