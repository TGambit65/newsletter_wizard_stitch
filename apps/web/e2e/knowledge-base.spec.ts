import { test, expect } from '@playwright/test';

test.describe('Knowledge Base', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/knowledge-base');
    await expect(page.url()).toMatch(/auth|login/);
  });

  test('embed knowledge base page should load', async ({ page }) => {
    await page.goto('/embed/knowledge-base');
    await expect(page).toHaveTitle(/Newsletter/);
  });
});
