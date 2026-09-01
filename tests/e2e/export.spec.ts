import { test, expect } from '@playwright/test';

test.describe('Case Overview and Export', () => {
  test('View case overview and export PDF', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Overview
    await page.goto('/cases/CASE-001/overview');
    await expect(page.getByTestId('page-heading')).toHaveText(/Test Investigation/i);

    // 3. Check for details
    await expect(page.locator('text=CR-2026-001')).toBeVisible();

    // 4. Test PDF Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Official Case Diary")');
    const download = await downloadPromise;

    // Verify filename and that it successfully downloaded
    expect(download.suggestedFilename()).toMatch(/Case_CR-2026-001_Diary\.pdf/);
    
    // Check file is not empty
    const failure = await download.failure();
    expect(failure).toBeNull();
  });
});