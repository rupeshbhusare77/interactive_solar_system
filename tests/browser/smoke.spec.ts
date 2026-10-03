import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-03T00:00:00Z'));
  await page.addInitScript(() => {
    let seed = 123456789;
    Math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  test('navigation, measurement, guide, and framing at ' + viewport.width, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    const failedAssets: string[] = [];
    page.on('response', response => { if (response.url().startsWith('http://127.0.0.1:5175/') && response.status() >= 400) failedAssets.push(response.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
    await search.fill('Moon'); await search.press('ArrowDown'); await search.press('Enter');
    await expect(page.getByRole('heading', { name: 'Moon', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
    await page.getByRole('button', { name: 'Measure distance', exact: true }).click();
    await page.getByRole('button', { name: 'Earth ⇄ Moon', exact: true }).click();
    await expect(page.locator('#measurement-origin')).toHaveValue('earth');
    await expect(page.locator('#measurement-target')).toHaveValue('moon');
    const distanceText = await page.getByLabel('Distance measurement').innerText();
    const kilometers = Number(distanceText.match(/\(([\d,]+)\s+km\)/)![1].replaceAll(',', ''));
    expect(kilometers).toBeGreaterThan(345000); expect(kilometers).toBeLessThan(420000);
    await page.getByRole('button', { name: 'Close measurement', exact: true }).click();
    await page.getByRole('button', { name: 'Open astronomical guide and controls' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    if (viewport.width < 768) {
      await page.getByRole('button', { name: 'Open settings menu' }).click();
      await page.getByRole('button', { name: 'Top View', exact: true }).click();
      await page.getByRole('button', { name: 'Close settings menu' }).click();
    } else {
      await page.getByRole('button', { name: 'Camera tracking mode' }).click();
      await page.getByRole('option', { name: /Top View/ }).click();
    }
    await page.getByLabel('View region', { exact: true }).selectOption('inner');
    await expect(page.getByLabel('View region', { exact: true })).toHaveValue('inner');
    const rect = await page.getByLabel('View region', { exact: true }).boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByRole('alert', { name: 'Scene recovery' })).not.toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Loading scene assets' })).not.toBeVisible();
    await expect(page.locator('summary').filter({ hasText: 'Using fallback maps' })).not.toBeVisible();
    expect(failedAssets).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('overview.png') });
  });
}

test('failed Earth maps recover without replacing the scene', async ({ page }) => {
  await page.route('**/textures/earth.jpg', route => route.abort());
  await page.goto('./');
  await expect(page.locator('summary').filter({ hasText: /Using fallback maps for 1/ })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});
