import { test, expect } from '@playwright/test';

// This is a test file
test('basic test', async () => {
  expect(true).toBeTruthy();
});

test.describe('Project tests', () => {
  test.beforeEach(async ({ page }) => {
    // The page should already be authenticated due to storageState
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load projects page', async ({ page }) => {
    // Basic test to verify page loads
    await page.getByRole('listitem').getByText('Home').click();
  });
});
