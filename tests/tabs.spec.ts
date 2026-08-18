import { expect, test } from '@playwright/test';

test.describe('Tab Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tab-bar')).toBeVisible();
    await expect(page.locator('.excalidraw')).toBeVisible();
  });

  test('create, rename, and cancel rename of tabs', async ({ page }) => {
    // Default tab exists
    await expect(page.getByTestId('tab-title')).toHaveText('Tab 1');

    // Create Tab 2
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(1).getByTestId('tab-title')).toHaveText('Tab 2');

    // Rename Tab 2
    await tabs.nth(1).getByTestId('tab-title').dblclick();
    const input = tabs.nth(1).getByTestId('tab-title-input');
    await expect(input).toBeVisible();
    await input.fill('Design Sketch');
    await input.press('Enter');
    await expect(tabs.nth(1).getByTestId('tab-title')).toHaveText(
      'Design Sketch',
    );

    // Cancel rename via Escape
    await tabs.nth(1).getByTestId('tab-title').dblclick();
    const editInput = tabs.nth(1).getByTestId('tab-title-input');
    await editInput.fill('Will Cancel');
    await editInput.press('Escape');
    await expect(tabs.nth(1).getByTestId('tab-title')).toHaveText(
      'Design Sketch',
    );
  });

  test('ignore empty or whitespace-only rename', async ({ page }) => {
    const tab = page.getByTestId('tab').first();
    await tab.getByTestId('tab-title').dblclick();
    const input = tab.getByTestId('tab-title-input');
    await input.fill('   ');
    await input.press('Enter');
    // Title remains unchanged
    await expect(tab.getByTestId('tab-title')).toHaveText('Tab 1');
  });

  test('switch active tab on click', async ({ page }) => {
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');

    // Tab 2 is active initially after creation
    await expect(tabs.nth(1)).toHaveClass(/active/);
    await expect(tabs.nth(0)).not.toHaveClass(/active/);

    // Click Tab 1
    await tabs.nth(0).click();
    await expect(tabs.nth(0)).toHaveClass(/active/);
    await expect(tabs.nth(1)).not.toHaveClass(/active/);
  });

  test('delete empty tab directly and fall back to remaining tab', async ({
    page,
  }) => {
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);

    // Delete active Tab 2
    await tabs.nth(1).getByTestId('tab-delete-button').click();
    await expect(tabs).toHaveCount(1);
    await expect(tabs.first().getByTestId('tab-title')).toHaveText('Tab 1');
    await expect(tabs.first()).toHaveClass(/active/);
  });

  test('delete non-empty tab handles confirmation dialog', async ({ page }) => {
    // Inject an element into the current tab via localStorage to test confirm prompt
    await page.evaluate(() => {
      const raw = localStorage.getItem('excalidraw-tabs-data');
      if (raw) {
        const data = JSON.parse(raw);
        data.state.tabs[0].elements = [{ id: 'dummy-1', type: 'rectangle' }];
        localStorage.setItem('excalidraw-tabs-data', JSON.stringify(data));
      }
    });
    await page.reload();

    // Dialog dismiss: should NOT delete tab
    page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await page.getByTestId('tab-delete-button').click();
    await expect(page.getByTestId('tab')).toHaveCount(1);

    // Create second tab so deletion is testable
    await page.getByTestId('new-tab-button').click();
    await expect(page.getByTestId('tab')).toHaveCount(2);

    // Dialog accept on non-empty tab
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    // Switch to Tab 1 (which has elements) and delete
    await page.getByTestId('tab').nth(0).click();
    await page
      .getByTestId('tab')
      .nth(0)
      .getByTestId('tab-delete-button')
      .click();
    await expect(page.getByTestId('tab')).toHaveCount(1);
  });

  test('cannot delete the last remaining tab', async ({ page }) => {
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(1);

    // Click delete on the only tab
    await tabs.first().getByTestId('tab-delete-button').click();
    // 1 tab must still remain
    await expect(tabs).toHaveCount(1);
    await expect(tabs.first().getByTestId('tab-title')).toHaveText('Tab 1');
  });

  test('tabs and order persist across page reload', async ({ page }) => {
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);

    await page.reload();
    const reloadedTabs = page.getByTestId('tab');
    await expect(reloadedTabs).toHaveCount(2);
    await expect(reloadedTabs.nth(0).getByTestId('tab-title')).toHaveText(
      'Tab 1',
    );
    await expect(reloadedTabs.nth(1).getByTestId('tab-title')).toHaveText(
      'Tab 2',
    );
  });

  test('drawings in separate tabs are isolated and persist across tab switch and reload', async ({
    page,
  }) => {
    // 1. Draw a rectangle on Tab 1
    const rectTool = page
      .locator('[aria-label*="Rectangle"], [title*="Rectangle"]')
      .first();
    await rectTool.click();

    const canvas = page.locator('.excalidraw canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + 250, box.y + 250);
      await page.mouse.down();
      await page.mouse.move(box.x + 400, box.y + 400, { steps: 10 });
      await page.mouse.up();
    }

    // Verify Tab 1 has elements in store
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const raw = localStorage.getItem('excalidraw-tabs-data');
            if (!raw) return 0;
            const data = JSON.parse(raw);
            return data.state?.tabs?.[0]?.elements?.length || 0;
          });
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);

    // 2. Create and switch to Tab 2
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);

    // Tab 2 starts with 0 elements
    const tab2Initial = await page.evaluate(() => {
      const raw = localStorage.getItem('excalidraw-tabs-data');
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return data.state?.tabs?.[1]?.elements?.length || 0;
    });
    expect(tab2Initial).toBe(0);

    // 3. Draw a diamond on Tab 2
    const diamondTool = page
      .locator('[aria-label*="Diamond"], [title*="Diamond"]')
      .first();
    await diamondTool.click();

    if (box) {
      await page.mouse.move(box.x + 450, box.y + 250);
      await page.mouse.down();
      await page.mouse.move(box.x + 550, box.y + 350, { steps: 10 });
      await page.mouse.up();
    }

    // Verify Tab 2 has elements in store
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const raw = localStorage.getItem('excalidraw-tabs-data');
            if (!raw) return 0;
            const data = JSON.parse(raw);
            return data.state?.tabs?.[1]?.elements?.length || 0;
          });
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);

    // 4. Switch back to Tab 1
    await tabs.nth(0).click();

    // 5. Reload page and check that both tabs preserved their distinct elements
    await page.reload();
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const raw = localStorage.getItem('excalidraw-tabs-data');
            if (!raw) return { t1: false, t2: false };
            const data = JSON.parse(raw);
            return {
              t1: (data.state?.tabs?.[0]?.elements?.length || 0) > 0,
              t2: (data.state?.tabs?.[1]?.elements?.length || 0) > 0,
            };
          });
        },
        { timeout: 10000 },
      )
      .toEqual({ t1: true, t2: true });
  });

  test('reorder tabs via drag handle with varied label lengths', async ({
    page,
  }) => {
    // Tab 1: Rename to a very long label
    const tab1 = page.getByTestId('tab').first();
    await tab1.getByTestId('tab-title').dblclick();
    const input1 = tab1.getByTestId('tab-title-input');
    await input1.fill('Extremely Long Diagram Name For System Architecture');
    await input1.press('Enter');

    // Tab 2: Create and rename to short label
    await page.getByTestId('new-tab-button').click();
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);
    const tab2 = tabs.nth(1);
    await tab2.getByTestId('tab-title').dblclick();
    const input2 = tab2.getByTestId('tab-title-input');
    await input2.fill('A');
    await input2.press('Enter');

    // 1. Drag Tab 2 (right) left over Tab 1 (left)
    const grip1 = page.getByTestId('tab').nth(0).getByTestId('tab-drag-handle');
    const grip2 = page.getByTestId('tab').nth(1).getByTestId('tab-drag-handle');

    let box1 = await grip1.boundingBox();
    let box2 = await grip2.boundingBox();

    if (box1 && box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.mouse.down();
      await page.mouse.move(box1.x + 20, box1.y + box1.height / 2, {
        steps: 20,
      });
      await page.mouse.up();
    }

    // 1. Verify order swapped in DOM: ['A', 'Extremely Long...']
    await expect(
      page.getByTestId('tab').nth(0).getByTestId('tab-title'),
    ).toHaveText('A');
    await expect(
      page.getByTestId('tab').nth(1).getByTestId('tab-title'),
    ).toHaveText('Extremely Long Diagram Name For System Architecture');

    // 2. Drag Tab 2 (now the long tab on the right) back to the left over Tab 1
    const secondGripLong = page
      .getByTestId('tab')
      .nth(1)
      .getByTestId('tab-drag-handle');
    const firstGripShort = page
      .getByTestId('tab')
      .nth(0)
      .getByTestId('tab-drag-handle');

    box1 = await firstGripShort.boundingBox();
    box2 = await secondGripLong.boundingBox();

    if (box1 && box2) {
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.mouse.down();
      await page.mouse.move(box1.x + 15, box1.y + box1.height / 2, {
        steps: 25,
      });
      await page.mouse.up();
    }

    // Verify order swapped back in DOM
    await expect(
      page.getByTestId('tab').nth(0).getByTestId('tab-title'),
    ).toHaveText('Extremely Long Diagram Name For System Architecture');
    await expect(
      page.getByTestId('tab').nth(1).getByTestId('tab-title'),
    ).toHaveText('A');
  });

  test('tab assigned color persists in storage and attributes across reload', async ({
    page,
  }) => {
    // Check initial tab has a data-color attribute
    const initialTab = page.getByTestId('tab').first();
    await expect(initialTab).toHaveAttribute(
      'data-color',
      /default|blue|emerald|amber|purple|rose|cyan/,
    );
    const initialColor = await initialTab.getAttribute('data-color');

    // Create a second tab and verify it gets a color
    await page.getByTestId('new-tab-button').click();
    const secondTab = page.getByTestId('tab').nth(1);
    await expect(secondTab).toHaveAttribute(
      'data-color',
      /default|blue|emerald|amber|purple|rose|cyan/,
    );
    const secondColor = await secondTab.getAttribute('data-color');

    // Reload page and verify colors persist
    await page.reload();
    await expect(page.getByTestId('tab')).toHaveCount(2);

    const reloadedTab1 = page.getByTestId('tab').first();
    const reloadedTab2 = page.getByTestId('tab').nth(1);

    await expect(reloadedTab1).toHaveAttribute('data-color', initialColor!);
    await expect(reloadedTab2).toHaveAttribute('data-color', secondColor!);
  });

  test('seamlessly migrates and preserves legacy un-wrapped excalidraw-tabs-data saves', async ({
    page,
  }) => {
    // 1. Seed legacy format into localStorage (pre-Zustand-persist structure)
    await page.addInitScript(() => {
      const legacyData = {
        tabs: [
          {
            id: 0,
            title: 'Legacy Architecture Diagram',
            elements: [
              {
                id: 'legacy-elem-1',
                type: 'rectangle',
                x: 50,
                y: 50,
                width: 120,
                height: 80,
                strokeColor: '#000000',
                backgroundColor: 'transparent',
              },
            ],
            appState: {},
          },
          {
            id: 1,
            title: 'Legacy Flowchart',
            elements: [],
            appState: {},
          },
        ],
        currentTabId: 0,
      };
      localStorage.setItem('excalidraw-tabs-data', JSON.stringify(legacyData));
    });

    await page.goto('/');

    // 2. Verify all legacy tabs and titles loaded without data loss
    const tabs = page.getByTestId('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0).getByTestId('tab-title')).toHaveText(
      'Legacy Architecture Diagram',
    );
    await expect(tabs.nth(1).getByTestId('tab-title')).toHaveText(
      'Legacy Flowchart',
    );

    // 3. Verify elements from legacy save are intact in store
    const storeElements = await page.evaluate(() => {
      const raw = localStorage.getItem('excalidraw-tabs-data');
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const tabs = data.state ? data.state.tabs : data.tabs;
      return tabs?.[0]?.elements?.length || 0;
    });
    expect(storeElements).toBe(1);
  });
});
