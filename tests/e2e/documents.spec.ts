import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Documents Vault', () => {
  const dummyFilePath = path.join(__dirname, 'dummy.txt');
  const replacementFilePath = path.join(__dirname, 'replacement.txt');

  test.beforeAll(() => {
    fs.writeFileSync(dummyFilePath, 'This is a test document.');
    fs.writeFileSync(replacementFilePath, 'This is a test document v2.');
  });

  test.afterAll(() => {
    if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    if (fs.existsSync(replacementFilePath)) fs.unlinkSync(replacementFilePath);
  });

  test('Upload, view, replace, and download document', async ({ page }) => {
    // 1. Login as IO001
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to documents for CASE-001
    await page.goto('/cases/CASE-001/documents');
    await expect(page.getByTestId('page-heading')).toHaveText(/Case Documents/i);

    // 3. Upload a new document
    await page.selectOption('select', 'FIR');
    await page.fill('input[placeholder="Brief description"]', 'Initial FIR Document');
    
    // Set file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(dummyFilePath);
    }
    
    // Click Upload
    await page.click('button[type="submit"]');

    // Wait for the table to populate with our document
    await expect(page.locator('table')).toContainText('Initial FIR Document');
    await expect(page.locator('table')).toContainText('v1');
    
    // Check if the hash is displayed (64 char hex)
    const tableText = await page.locator('table').innerText();
    const hashRegex = /[a-f0-9]{64}/i;
    expect(tableText).toMatch(hashRegex);

    // 4. Upload a replacement version
    const replaceInput = await page.$('input[type="file"].hidden');
    if (replaceInput) {
      await replaceInput.setInputFiles(replacementFilePath);
    }

    // Wait for the version to increment to v2
    await expect(page.locator('table')).toContainText('v2');
    
    // 5. Download the file
    // Note: In Playwright, downloading a file is handled specially
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Download');
    const download = await downloadPromise;
    
    // Check downloaded file matches replacement
    const downloadPath = await download.path();
    const downloadedContent = fs.readFileSync(downloadPath, 'utf8');
    expect(downloadedContent).toBe('This is a test document v2.');
  });
});