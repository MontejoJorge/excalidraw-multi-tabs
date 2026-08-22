import { expect, test } from '@playwright/test';

test.describe('Theme Synchronization & Canvas Consistency', () => {
  test('bidirectional toggle (Moon -> Sun -> Moon) updates icons, titles, and canvas theme', async ({
    page,
  }) => {
    await page.goto('/');
    const htmlElement = page.locator('html');
    const excalidraw = page.locator('.excalidraw');
    const toggleButton = page.getByTestId('theme-toggle-button');
    await expect(excalidraw).toBeVisible();

    // 1. Initial state (light mode by default in standard browser context)
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to dark mode');
    await expect(excalidraw).not.toHaveClass(/theme--dark/);

    // 2. Click to toggle to dark mode
    await toggleButton.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to light mode');
    await expect(excalidraw).toHaveClass(/theme--dark/);

    // Verify localStorage has flat JSON with theme: 'dark'
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const raw = localStorage.getItem('excalidraw-tabs-data');
          if (!raw) return null;
          return JSON.parse(raw).theme;
        });
      })
      .toBe('dark');

    // 3. Click Sun icon to switch BACK to light mode
    await toggleButton.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to dark mode');
    await expect(excalidraw).not.toHaveClass(/theme--dark/);

    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const raw = localStorage.getItem('excalidraw-tabs-data');
          if (!raw) return null;
          return JSON.parse(raw).theme;
        });
      })
      .toBe('light');
  });

  test('dark mode canvas and UI persist across page reload and tab creation', async ({
    page,
  }) => {
    await page.goto('/');
    const htmlElement = page.locator('html');
    const excalidraw = page.locator('.excalidraw');
    const toggleButton = page.getByTestId('theme-toggle-button');
    await expect(excalidraw).toBeVisible();

    // 1. Switch to dark mode
    await toggleButton.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // 2. Create a second tab
    await page.getByTestId('new-tab-button').click();
    await expect(page.getByTestId('tab-title')).toHaveCount(2);

    // 3. Reload page while on Tab 2 in dark mode
    await page.reload();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to light mode');
    await expect(excalidraw).toHaveClass(/theme--dark/);

    // Verify Tab 2 is still active and dark
    const tabs = page.getByTestId('tab-title');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(1)).toHaveClass(/active/);

    // 4. Switch back to Tab 1 — should seamlessly remain in dark mode
    await tabs.nth(0).click();
    await expect(tabs.nth(0)).toHaveClass(/active/);
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect(excalidraw).toHaveClass(/theme--dark/);

    // 5. Toggle Sun icon to return to light mode
    await toggleButton.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to dark mode');
    await expect(excalidraw).not.toHaveClass(/theme--dark/);
  });

  test('canvas applies native dark inversion filter without custom viewBackgroundColor corruption', async ({
    page,
  }) => {
    await page.goto('/');
    const toggleButton = page.getByTestId('theme-toggle-button');
    const excalidraw = page.locator('.excalidraw');
    await expect(excalidraw).toBeVisible();

    // 1. In Light Mode: canvas filter should be 'none'
    const lightFilter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.excalidraw__canvas.static');
      return canvas ? getComputedStyle(canvas).filter : '';
    });
    expect(lightFilter).toBe('none');

    // 2. Switch to Dark Mode: Excalidraw must apply invert filter
    await toggleButton.click();
    await expect(excalidraw).toHaveClass(/theme--dark/);

    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const canvas = document.querySelector(
            'canvas.excalidraw__canvas.static',
          );
          return canvas ? getComputedStyle(canvas).filter : '';
        });
      })
      .toContain('invert(0.93)');

    // 3. Verify stored tab appState does not store #121212 override (which causes grayish inversion)
    const storedAppState = await page.evaluate(() => {
      const raw = localStorage.getItem('excalidraw-tabs-data');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.tabs?.[0]?.appState;
    });
    expect(storedAppState?.viewBackgroundColor).not.toBe('#121212');

    // 4. Reload page in dark mode: verify inversion filter persists immediately
    await page.reload();
    await expect(excalidraw).toHaveClass(/theme--dark/);

    const reloadedFilter = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.excalidraw__canvas.static');
      return canvas ? getComputedStyle(canvas).filter : '';
    });
    expect(reloadedFilter).toContain('invert(0.93)');
  });

  test('respects system dark mode preference on initial session', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const htmlElement = page.locator('html');
    const excalidraw = page.locator('.excalidraw');
    const toggleButton = page.getByTestId('theme-toggle-button');

    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect(toggleButton).toHaveAttribute('title', 'Switch to light mode');
    await expect(excalidraw).toHaveClass(/theme--dark/);
  });
});
