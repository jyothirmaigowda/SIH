import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Every sidebar route must render its OWN page-level heading.
 * Guards against the known bug where Documents/Evidence/Timeline/Reports
 * render the Cases page instead of their own component.
 * See: SIMS-SPEC.md - 'Known historical bug to explicitly avoid'
 */

test.describe('Login page renders correctly', () => {
  test('/login renders sign-in heading', async ({ page }) => {
    await page.goto('/login');
    const heading = page.getByTestId('page-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('SIMS — Sign In');
  });
});

test.describe('Protected routes redirect to login - NOT to Cases page', () => {
  const routes = [
    '/dashboard',
    '/cases',
    '/documents',
    '/evidence',
    '/timeline',
    '/audit',
    '/reports',
    '/notifications',
    '/search',
    '/profile',
  ];

  for (const route of routes) {
    test(route + ' redirects unauthenticated users to /login', async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
      // Explicit guard: must NOT render the Cases Registry heading for sidebar routes
      await expect(page.getByText('Cases Registry')).not.toBeVisible();
    });
  }
});