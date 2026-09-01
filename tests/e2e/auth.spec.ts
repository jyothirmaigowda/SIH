import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Valid login routes to dashboard', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByTestId('page-heading')).toHaveText(/dashboard/i);
  });

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="employeeId"]', 'IO001');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Should stay on login and show error
    await expect(page).toHaveURL(/.*\/login/);
    const errorMsg = page.getByTestId('error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(/Invalid credentials/i);
  });

  test('Session state is maintained', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'SUP001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate directly to protected route
    await page.goto('/cases');
    await expect(page).toHaveURL(/.*\/cases/); // Should allow access

    // Check API session endpoint
    const res = await page.request.get('/api/auth/session');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.user.employeeId).toBe('SUP001');
    expect(data.user.role).toBe('SUPERVISOR');
  });

  test('Logout destroys session', async ({ request, page }) => {
    // We can simulate logout via API
    // First let's get a session manually via API to test logout
    await page.goto('/login');
    await page.fill('input[name="employeeId"]', 'LEG001');
    await page.fill('input[name="password"]', 'sims123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Call logout endpoint
    await page.request.post('/api/auth/logout');

    // Go to protected route -> should redirect to login
    await page.goto('/cases');
    await expect(page).toHaveURL(/.*\/login/);
  });
});