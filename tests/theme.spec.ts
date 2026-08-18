import { expect, test } from '@playwright/test';

test.describe('Theme Synchronization', () => {
  test('toggle theme updates data-theme attribute and persists across reload', async ({
    page,
  }) => {
    await page.goto('/');
    const htmlElement = page.locator('html');
    const initialTheme =
      (await htmlElement.getAttribute('data-theme')) || 'light';

    const toggleButton = page.getByTestId('theme-toggle-button');
    await toggleButton.click();

    const newTheme = await htmlElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    await page.reload();
    const reloadedTheme = await htmlElement.getAttribute('data-theme');
    expect(reloadedTheme).toBe(newTheme);
  });

  test('respects system dark mode preference on initial session', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });
});
