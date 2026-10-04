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

test('Saturn catalog, system framing, reference accuracy, and unknown physical data', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name:'Reset date to now', exact:true }).click();
  const search=page.getByRole('combobox',{name:'Search celestial bodies'});
  await search.fill('Saturn');await search.press('ArrowDown');await search.press('Enter');
  await expect(page.getByRole('heading',{name:'Saturn',exact:true})).toBeVisible();
  const details=page.getByRole('button',{name:'Details',exact:true});
  if(await details.isVisible())await details.click();
  await expect(page.getByText(/293 cataloged; 291 with orbital data/)).toBeVisible();
  await page.getByRole('button',{name:'Explore Moon System'}).click();
  await page.getByLabel('Filter moons').fill('Rhea');
  await expect(page.getByRole('button',{name:/Rhea/})).toBeVisible();
  await page.getByRole('button',{name:/Rhea/}).click();
  await expect(page.getByLabel('Scientific accuracy')).toContainText('JPL reference interpolation');
  await expect(page.getByRole('link',{name:'Surface map and credits'})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('rhea.png')});
  await page.getByRole('button',{name:'Close telemetry panel',exact:true}).click();
  await search.fill('S/2020 S 1');await search.press('ArrowDown');await search.press('Enter');
  await page.getByRole('tab',{name:'Physical',exact:true}).click();
  await expect(page.getByLabel(/information/)).not.toContainText('NaN');
  await expect(page.getByRole('alert',{name:'Scene recovery'})).not.toBeVisible();
});


test('focused bodies render without shader errors or failed maps', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
  for (const name of ['Earth', 'Jupiter', 'Saturn', 'Moon', 'Sun', '2P/Encke']) {
    await search.fill(name);
    await search.press('ArrowDown');
    await search.press('Enter');
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Loading scene assets' })).not.toBeVisible();
    await expect(page.locator('summary').filter({ hasText: 'Using fallback maps' })).not.toBeVisible();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole('alert', { name: 'Scene recovery' })).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(name.replace(/[^a-z]/gi, '') + '.png') });
    await page.getByRole('button', { name: 'Visual layers' }).click();
    const labels = page.getByRole('button', { name: 'Celestial labels', exact: true });
    await labels.click();
    await expect(labels).toHaveAttribute('aria-pressed', 'false');
    const scene = page.locator('canvas').locator('..').locator('..');
    await expect(scene.locator('span')).toHaveCount(0);
    await labels.click();
    await expect(labels).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});


test('focus and follow retain other planets and respect the orbit layer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
  await search.fill('Earth'); await search.press('ArrowDown'); await search.press('Enter');
  await page.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Loading scene assets' })).not.toBeVisible();
  const scene = page.locator('canvas').locator('..').locator('..');
  const settle = () => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  for (const mode of ['Focus', 'Lock & Follow']) {
    await page.getByRole('button', { name: 'Camera tracking mode' }).click();
    await page.getByRole('option', { name: new RegExp('^' + mode) }).click();
    await settle();
    for (const name of ['Sun', 'Jupiter', 'Saturn', 'Neptune']) {
      await expect(scene.getByText(name, { exact: true })).toBeAttached();
    }
    await page.mouse.move(1400, 20);
    const withOrbits = await page.screenshot({ clip: { x: 380, y: 120, width: 800, height: 580 } });
    await page.getByRole('button', { name: 'Visual layers' }).click();
    const orbitToggle = page.getByRole('button', { name: 'Orbit paths', exact: true });
    await expect(orbitToggle).toHaveAttribute('aria-pressed', 'true');
    await orbitToggle.click();
    await expect(orbitToggle).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
    await page.mouse.move(1400, 20); await settle();
    const withoutOrbits = await page.screenshot({ clip: { x: 380, y: 120, width: 800, height: 580 } });
    expect(withOrbits.equals(withoutOrbits)).toBe(false);
    await page.getByRole('button', { name: 'Visual layers' }).click();
    await orbitToggle.click();
    await page.keyboard.press('Escape');
  }
});


test('responsive controls stay reachable after resizing and opening settings', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 667, height: 375 }, { width: 844, height: 390 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const header = page.locator('.app-header');
    const initialHeight = (await header.boundingBox())!.height;
    if (viewport.width < 768) {
      for (let count = 0; count < 2; count++) {
        await page.getByRole('button', { name: 'Open settings menu', exact: true }).click();
        const settings = page.getByRole('region', { name: 'Display settings' });
        await expect(settings).toBeVisible();
        const bounds = (await settings.boundingBox())!;
        expect(bounds.y).toBeGreaterThanOrEqual(initialHeight);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
        await settings.getByRole('button', { name: 'Moons', exact: true }).scrollIntoViewIfNeeded();
        if (count === 0) await page.screenshot({ path: testInfo.outputPath(`settings-${viewport.width}x${viewport.height}.png`) });
        await page.getByRole('button', { name: 'Close settings menu', exact: true }).click();
        expect(Math.abs((await header.boundingBox())!.height - initialHeight)).toBeLessThan(2);
      }
    }
    for (const selector of ['.app-header', '.header-search', '.header-actions', '.timeline-panel', '.quick-dock']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x, selector).toBeGreaterThanOrEqual(0);
      expect(box.y, selector).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height, selector).toBeLessThanOrEqual(viewport.height + 1);
    }
    await page.getByRole('button', { name: 'Visual layers', exact: true }).click();
    const layers = (await page.getByRole('group', { name: 'Visual layers', exact: true }).boundingBox())!;
    expect(layers.x).toBeGreaterThanOrEqual(0);
    expect(layers.x + layers.width).toBeLessThanOrEqual(viewport.width + 1);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Set simulation date', exact: true }).click();
    const date = (await page.locator('.timeline-popover:not([hidden])').boundingBox())!;
    expect(date.x).toBeGreaterThanOrEqual(0);
    expect(date.y).toBeGreaterThanOrEqual(0);
    expect(date.x + date.width).toBeLessThanOrEqual(viewport.width + 1);
    await page.getByRole('button', { name: 'Set simulation date', exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`responsive-${viewport.width}x${viewport.height}.png`) });
  }
});
