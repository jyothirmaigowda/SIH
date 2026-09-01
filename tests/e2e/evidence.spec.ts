import { test, expect } from '@playwright/test';

test.describe('Evidence and Custody Chain', () => {
  // Cleanup hook if we want to ensure fresh runs
  // Note: For simplicity, we just use unique refs if needed, or rely on the previous run's DB state.
  // Actually, let's use a unique timestamp for the evidence ref so it never fails on re-runs.
  const uniqueRef = `EVD-${Date.now()}`;

  test('Register evidence and update custody chain', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Evidence Registry
    await page.goto('/cases/CASE-001/evidence');
    await expect(page.getByTestId('page-heading')).toHaveText(/Evidence Registry/i);

    // 3. Register Evidence
    await page.fill('input[placeholder="e.g., EVD-001"]', uniqueRef);
    await page.selectOption('select', 'PHYSICAL');
    await page.fill('input:near(label:has-text("Description"))', 'Bloody knife');
    await page.fill('input:near(label:has-text("Source"))', 'Crime Scene Area 1');
    await page.fill('input:near(label:has-text("Collection Place"))', 'Living Room');
    
    await page.click('button:has-text("Register Evidence")');

    // Wait for table to update
    await expect(page.locator('table')).toContainText(uniqueRef);
    await expect(page.locator('table')).toContainText('Bloody knife');
    await expect(page.locator('table')).toContainText('COLLECTED');

    // 4. View Custody Chain
    // Find the row containing our unique ref and click its "View Custody Chain" button
    const row = page.locator(`tr:has-text("${uniqueRef}")`);
    await row.locator('button:has-text("View Custody Chain")').click();

    // Ensure we are on the custody page
    await expect(page).toHaveURL(/.*\/custody\?evidenceId=.+/);
    await expect(page.getByTestId('page-heading')).toHaveText(/Chain of Custody/i);

    // Verify initial event exists in timeline
    await expect(page.locator('div.space-y-4')).toContainText('COLLECTED');

    // 5. Append a new Custody Event (Transfer)
    await page.selectOption('select', 'TRANSFERRED');
    await page.fill('input:near(label:has-text("Location"))', 'Evidence Locker Room B');
    await page.fill('input:near(label:has-text("Purpose"))', 'Secure Storage');
    await page.fill('input[placeholder="Leave blank if internal"]', 'SUP001'); // Transfer to Supervisor
    await page.fill('textarea:near(label:has-text("Notes"))', 'Handed over securely');

    await page.click('button:has-text("Append Event")');

    // Wait for timeline to update (should have 2 items, the newest being TRANSFERRED)
    await expect(page.locator('div.space-y-4')).toContainText('TRANSFERRED');
    await expect(page.locator('div.space-y-4')).toContainText('Evidence Locker Room B');
    await expect(page.locator('div.space-y-4')).toContainText('Supervisor One'); 
  });
});