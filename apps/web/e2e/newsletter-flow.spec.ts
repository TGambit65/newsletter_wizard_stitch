import { test, expect } from '@playwright/test';

test.describe('Newsletter Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/newsletters');
    await expect(page).toHaveURL(/.*login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password inputs
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Check for submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form shows validation for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation message or still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('signup page is accessible from login', async ({ page }) => {
    await page.goto('/login');
    
    // Find and click signup link
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup/);
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.getByRole('link', { name: /forgot/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('embed wizard page loads without auth', async ({ page }) => {
    await page.goto('/embed');
    
    // Embed page should be publicly accessible
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('embed knowledge base page loads without auth', async ({ page }) => {
    await page.goto('/embed/knowledge-base');
    
    // Embed page should be publicly accessible
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('wizard page requires authentication', async ({ page }) => {
    await page.goto('/wizard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('settings page requires authentication', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Public Pages', () => {
  test('API docs page is accessible', async ({ page }) => {
    await page.goto('/api-docs.html');
    
    // Check that the page loads with API documentation content
    await expect(page.getByText(/API/i)).toBeVisible();
  });
});
