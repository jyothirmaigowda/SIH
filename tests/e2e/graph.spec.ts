import { test, expect } from '@playwright/test';

test.describe('Intelligence Graph', () => {
  const suspectName = `Suspect-${Date.now()}`;
  const locationName = `Location-${Date.now()}`;

  test('Create Nodes and link them with an Edge', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Graph Mapping
    await page.goto('/cases/CASE-001/graph');
    await expect(page.getByTestId('page-heading')).toHaveText(/Intelligence Graph/i);

    // 3. Create First Node (Person)
    await page.fill('input[placeholder="e.g. John Doe, Red Toyota"]', suspectName);
    await page.selectOption('select#nodeType', 'PERSON');
    await page.click('button:has-text("Add Node")');
    await expect(page.getByTestId('node-list')).toContainText(suspectName);

    // 4. Create Second Node (Location)
    await page.fill('input[placeholder="e.g. John Doe, Red Toyota"]', locationName);
    await page.selectOption('select#nodeType', 'LOCATION');
    await page.click('button:has-text("Add Node")');
    await expect(page.getByTestId('node-list')).toContainText(locationName);

    // 5. Create Edge connecting them
    await page.selectOption('select#fromNodeId', { label: `${suspectName} (PERSON)` });
    await page.selectOption('select#toNodeId', { label: `${locationName} (LOCATION)` });
    await page.selectOption('select#relationship', { label: `Involved In` });
    
    await page.click('button:has-text("Create Link")');

    // 6. Verify Edge is rendered in the relational map
    const edgeList = page.getByTestId('edge-list');
    await expect(edgeList).toContainText(suspectName);
    await expect(edgeList).toContainText('INVOLVED_IN');
    await expect(edgeList).toContainText(locationName);
  });
});