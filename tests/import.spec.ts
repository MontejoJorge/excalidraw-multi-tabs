import { expect, test } from '@playwright/test';

test.describe('Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('open and close modal on backdrop click', async ({ page }) => {
    const importBtn = page.getByTestId('import-modal-button');
    await importBtn.click();

    const overlay = page.getByTestId('modal-overlay');
    await expect(overlay).toBeVisible();

    // Click backdrop overlay to close
    await overlay.click({ position: { x: 10, y: 10 } });
    await expect(overlay).not.toBeVisible();
  });

  test('validate invalid Excalidraw URL displays error', async ({ page }) => {
    await page.getByTestId('import-modal-button').click();

    const input = page.getByTestId('import-url-input');
    await expect(input).toBeVisible();

    await input.fill('https://invalid-url.com');
    await input.press('Enter');

    const errorMsg = page.getByTestId('import-error-message');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('Invalid Excalidraw link');
  });

  test('handles network failure during board fetch', async ({ page }) => {
    // Intercept excalidraw API call and fail it
    await page.route('https://json.excalidraw.com/**', (route) =>
      route.abort(),
    );

    await page.getByTestId('import-modal-button').click();
    const input = page.getByTestId('import-url-input');

    await input.fill('https://excalidraw.com/#json=123456789,mockPrivateKey');
    await input.press('Enter');

    const errorMsg = page.getByTestId('import-error-message');
    await expect(errorMsg).toBeVisible();
  });

  test('successfully imports an Excalidraw board with encrypted payload', async ({
    page,
  }) => {
    // Generate valid 128-bit base64url AES-GCM key (22 chars)
    const privateKey = 'abcdefghijklmnopqrstuv';
    const mockBoardData = {
      type: 'excalidraw',
      version: 2,
      elements: [
        {
          id: 'imported-rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          strokeColor: '#000000',
          backgroundColor: '#ffc9c9',
          fillStyle: 'solid',
          strokeWidth: 1,
        },
      ],
      appState: {
        viewBackgroundColor: '#ffffff',
      },
    };

    // Construct valid Excalidraw binary format (version + chunks -> deflate -> AES-GCM encrypt)
    const payload = await page.evaluate(
      async ({ mockBoardData, privateKey }) => {
        // Helper to pack chunks in Excalidraw binary format
        const packChunks = (chunks: Uint8Array[]) => {
          const totalSize =
            4 + chunks.reduce((sum, c) => sum + 4 + c.byteLength, 0);
          const buffer = new Uint8Array(totalSize);
          const view = new DataView(buffer.buffer);
          view.setUint32(0, 2); // Version 2
          let offset = 4;
          for (const chunk of chunks) {
            view.setUint32(offset, chunk.byteLength);
            offset += 4;
            buffer.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return buffer;
        };

        const enc = new TextEncoder();
        const meta = enc.encode('{}');
        const data = enc.encode(JSON.stringify(mockBoardData));
        const inner = packChunks([meta, data]);

        // Simple pako-compatible or raw deflate via browser CompressionStream
        const cs = new CompressionStream('deflate');
        const writer = cs.writable.getWriter();
        writer.write(inner);
        writer.close();
        const compressedBuffer = await new Response(cs.readable).arrayBuffer();

        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);

        const cryptoKey = await crypto.subtle.importKey(
          'jwk',
          {
            alg: 'A128GCM',
            ext: true,
            k: privateKey,
            key_ops: ['encrypt', 'decrypt'],
            kty: 'oct',
          },
          { name: 'AES-GCM', length: 128 },
          false,
          ['encrypt'],
        );

        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          compressedBuffer,
        );

        const encodingHeader = enc.encode(
          JSON.stringify({
            version: 2,
            compression: 'pako@1',
            encryption: 'AES-GCM',
          }),
        );

        const finalBinary = packChunks([
          encodingHeader,
          iv,
          new Uint8Array(encrypted),
        ]);
        return Array.from(finalBinary);
      },
      { mockBoardData, privateKey },
    );

    const binaryBuffer = Buffer.from(payload);
    const fileId = 'mock-board-file-id';

    // Mock Excalidraw backend API
    await page.route(
      `https://json.excalidraw.com/api/v2/${fileId}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          body: binaryBuffer,
        });
      },
    );

    // Run import flow in our app
    await page.getByTestId('import-modal-button').click();
    const input = page.getByTestId('import-url-input');
    await input.fill(`https://excalidraw.com/#json=${fileId},${privateKey}`);
    await input.press('Enter');

    // Verify modal closes and new tab is created with title "Imported board"
    await expect(page.getByTestId('tab')).toHaveCount(2);
    const importedTab = page.getByTestId('tab').nth(1);
    await expect(importedTab.getByTestId('tab-title')).toHaveText(
      'Imported board',
    );

    // Verify the imported element exists in Zustand store
    await expect
      .poll(
        async () => {
          return await page.evaluate(() => {
            const raw = localStorage.getItem('excalidraw-tabs-data');
            if (!raw) return 0;
            const data = JSON.parse(raw);
            const tabs = data.state ? data.state.tabs : data.tabs;
            return tabs?.[1]?.elements?.length || 0;
          });
        },
        { timeout: 10000 },
      )
      .toBe(1);
  });
});
