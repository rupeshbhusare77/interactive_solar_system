import { test, expect } from '@playwright/test';

test('search uses textured thumbnails', async ({ page }) => {
  await page.goto('./');
  const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
  for (const name of ['Earth', 'Saturn', 'Moon', 'Halley']) {
    await search.fill(name);
    const option = page.getByRole('option', { name: new RegExp(name) }).first();
    await expect(option.locator('.body-thumbnail')).toBeVisible();
    if (name !== 'Halley') {
      await expect(option.locator('img')).toHaveJSProperty('complete', true);
      expect(await option.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
  }
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: /Halley/ })).toBeVisible();
});

test('expanded details stay below the header and scroll on mobile and short screens', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 667, height: 375 }, { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
    await search.fill('Earth');
    await search.press('ArrowDown');
    await search.press('Enter');
    const inspector = page.getByRole('complementary', { name: 'Earth information' });
    await inspector.getByRole('button', { name: 'Details', exact: true }).click();
    const panel = (await inspector.boundingBox())!;
    const header = (await page.locator('.app-header').boundingBox())!;
    expect(panel.y).toBeGreaterThanOrEqual(header.y + header.height + 4);
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height);
    const body = inspector.locator('.panel-body');
    expect((await body.boundingBox())!.height).toBeGreaterThan(60);
    await inspector.getByRole('tab', { name: 'Physical', exact: true }).click();
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expect(inspector.getByRole('button', { name: 'Collapse', exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`details-${viewport.width}.png`) });
    await inspector.getByRole('button', { name: 'Collapse', exact: true }).click();
    await inspector.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
  }
});
